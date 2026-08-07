import { create } from 'zustand';
import type { Track } from '@/types';
import {
  cacheTrack,
  uncacheTrack,
  clearTrackCache,
  lsGetOffline,
  lsSaveOffline,
  isOnline,
  withId,
  withoutId,
} from '@/lib/offline';

interface RatingReport {
  id: string;
  playedSec: number;
  durationSec: number;
  isSkip: boolean;
}

interface OfflineStore {
  enabled: boolean;
  downloaded: Record<string, true>;
  excluded: Record<string, true>;
  downloading: Record<string, true>;
  // Rating reports we couldn't send while offline — flushed once back online.
  ratingBuffer: RatingReport[];

  setEnabled: (v: boolean, tracks: Track[]) => Promise<void>;
  downloadOne: (id: string) => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  syncMissing: (tracks: Track[]) => Promise<void>;
  bufferRatingReport: (report: RatingReport) => void;
  flushRatingReports: () => Promise<void>;
}

export const offlineLsLoad = () => ({
  enabled: lsGetOffline<boolean>('enabled', false),
  downloaded: lsGetOffline<Record<string, true>>('downloaded', {}),
  excluded: lsGetOffline<Record<string, true>>('excluded', {}),
});

const SYNC_CONCURRENCY = 3;

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  enabled: false,
  downloaded: {},
  excluded: {},
  downloading: {},
  ratingBuffer: [],

  downloadOne: async (id) => {
    const { downloaded, downloading } = get();
    if (downloaded[id] || downloading[id]) return;
    set((s) => ({ downloading: withId(s.downloading, id) }));
    try {
      await cacheTrack(id);
      set((s) => {
        const downloaded = withId(s.downloaded, id);
        const excluded = withoutId(s.excluded, id);
        lsSaveOffline('downloaded', downloaded);
        lsSaveOffline('excluded', excluded);
        return { downloaded, excluded };
      });
    } catch {
      // best-effort — stays undownloaded, a later syncMissing/manual retry can pick it up
    } finally {
      set((s) => ({ downloading: withoutId(s.downloading, id) }));
    }
  },

  deleteOne: async (id) => {
    await uncacheTrack(id).catch(() => { /* best-effort */ });
    set((s) => {
      const downloaded = withoutId(s.downloaded, id);
      const excluded = withId(s.excluded, id);
      lsSaveOffline('downloaded', downloaded);
      lsSaveOffline('excluded', excluded);
      return { downloaded, excluded };
    });
  },

  setEnabled: async (v, tracks) => {
    lsSaveOffline('enabled', v);
    set({ enabled: v });
    if (v) {
      await get().syncMissing(tracks);
    } else {
      await clearTrackCache();
      lsSaveOffline('downloaded', {});
      lsSaveOffline('excluded', {});
      set({ downloaded: {}, excluded: {}, downloading: {} });
    }
  },

  syncMissing: async (tracks) => {
    if (!isOnline()) return;
    const { downloaded, excluded } = get();
    const todo = tracks
      .map((t) => t.id)
      .filter((id) => !downloaded[id] && !excluded[id]);
    if (!todo.length) return;

    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const id = todo[i++];
        if (!isOnline() || !get().enabled) return;
        await get().downloadOne(id);
      }
    };
    await Promise.all(Array.from({ length: Math.min(SYNC_CONCURRENCY, todo.length) }, worker));
  },

  bufferRatingReport: (report) => {
    set((s) => ({ ratingBuffer: [...s.ratingBuffer, report] }));
  },

  flushRatingReports: async () => {
    const { ratingBuffer } = get();
    if (!ratingBuffer.length) return;
    set({ ratingBuffer: [] });
    for (const r of ratingBuffer) {
      await fetch(`/api/tracks/${r.id}/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playedSec: r.playedSec, durationSec: r.durationSec, isSkip: r.isSkip }),
        keepalive: true,
      }).catch(() => { /* best-effort rating signal */ });
    }
  },
}));
