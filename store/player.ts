import { create } from 'zustand';
import { seekAudio } from '@/lib/audio';
import { weightedShuffleIds } from '@/lib/shuffle';
import type { Track } from '@/types';

const lsGet = <T>(key: string, def: T): T => {
  if (typeof window === 'undefined') return def;
  try {
    const v = localStorage.getItem('pv2_' + key);
    return v == null ? def : (JSON.parse(v) as T);
  } catch {
    return def;
  }
};

export const lsSave = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('pv2_' + key, JSON.stringify(value)); } catch { /* ignore */ }
};

export const lsLoad = () => {
  const rawQueue = lsGet<unknown[]>('queue', []);
  const queue = Array.isArray(rawQueue) && rawQueue.every((v) => typeof v === 'string')
    ? (rawQueue as string[])
    : [];
  return {
    queue,
    pos: lsGet<number>('pos', 0),
    vol: lsGet<number>('vol', 0.7),
    dark: lsGet<boolean | null>('dark', null),
  };
};

interface PlayerStore {
  tracks: Track[];
  playing: boolean;
  queue: string[];
  pos: number;
  time: number;
  vol: number;
  muted: boolean;
  showQ: boolean;
  toast: string | null;
  dark: boolean | null;

  setTracks: (tracks: Track[]) => void;
  setPlaying: (v: boolean) => void;
  togglePlaying: () => void;
  setTime: (t: number) => void;
  seek: (t: number) => void;
  setVol: (v: number) => void;
  toggleMuted: () => void;
  toggleShowQ: () => void;
  setDark: (v: boolean | null) => void;
  shuffle: () => void;
  next: () => void;
  prev: () => void;
  playTrack: (id: string) => void;
  addToQueue: (id: string) => void;
  removeFromQueue: (idx: number) => void;
  flash: (msg: string) => void;
  setRating: (id: string, rating: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  tracks: [],
  playing: false,
  queue: [],
  pos: 0,
  time: 0,
  vol: 0.7,
  muted: false,
  showQ: false,
  toast: null,
  dark: null,

  setTracks: (tracks) => {
    const { queue, pos } = get();
    const ids = new Set(tracks.map((t) => t.id));
    const validQueue = queue.filter((id) => ids.has(id));
    const newQueue = validQueue.length > 0 ? validQueue : weightedShuffleIds(tracks);
    set({ tracks, queue: newQueue, pos: Math.min(pos, newQueue.length - 1) });
  },

  setPlaying: (v) => set({ playing: v }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setTime: (t) => set({ time: t }),
  seek: (t) => { seekAudio(t); set({ time: t }); },
  setVol: (v) => set({ vol: v }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  toggleShowQ: () => set((s) => ({ showQ: !s.showQ })),
  setDark: (v) => set({ dark: v }),

  shuffle: () => {
    const { tracks } = get();
    if (!tracks.length) return;
    set({ queue: weightedShuffleIds(tracks), pos: 0, time: 0, playing: true });
  },

  next: () => {
    const { queue, pos } = get();
    set({ pos: (pos + 1) % queue.length, time: 0 });
  },
  prev: () => {
    const { time, queue, pos } = get();
    if (time > 3) {
      seekAudio(0);
      set({ time: 0 });
    } else {
      set({ pos: (pos - 1 + queue.length) % queue.length, time: 0 });
    }
  },
  playTrack: (id) => {
    const { queue } = get();
    const i = queue.indexOf(id);
    if (i >= 0) {
      set({ pos: i, time: 0, playing: true });
    } else {
      const newQueue = [...queue, id];
      set({ queue: newQueue, pos: newQueue.length - 1, time: 0, playing: true });
    }
  },
  addToQueue: (id) => {
    set((s) => ({ queue: [...s.queue, id] }));
    get().flash('Добавлено в очередь');
  },
  removeFromQueue: (idx) => {
    set((s) => ({
      queue: s.queue.filter((_, j) => j !== idx),
      pos: idx < s.pos ? s.pos - 1 : s.pos,
    }));
  },
  flash: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: null }), 1800);
  },

  setRating: (id, rating) => {
    const clamped = Math.max(-5, Math.min(5, rating));
    const weight = 2 ** clamped;
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, rating: clamped, weight } : t)),
    }));
    fetch(`/api/tracks/${id}/rating`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: clamped }),
    }).catch(() => { /* optimistic update stands; next fetch reconciles */ });
  },
}));
