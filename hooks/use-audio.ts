'use client';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import { useOfflineStore } from '@/store/offline';
import { setAudioEl, reportPlayback } from '@/lib/audio';
import { streamUrl, findPlayableIndex, getCachedTrackBlobUrl, isOnline } from '@/lib/offline';
import type { Track } from '@/types';

const MOBILE_QUERY = '(max-width: 639px)';

const PREFETCH_COUNT = 5;

// Chrome's automatic Media Session inference briefly drops the notification
// whenever the audio element's src is swapped mid-track-change (the resource
// selection algorithm fires a synchronous 'pause' before the new src can
// start playing). Setting playbackState explicitly right alongside play()/
// pause() calls sidesteps that race instead of waiting on implicit inference.
const setMediaPlaybackState = (state: MediaSessionPlaybackState) => {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = state;
};

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdRef = useRef<string | undefined>(undefined);
  const prefetchRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // Object URLs for downloaded upcoming tracks, prepared ahead of time so the
  // 'ended' handler can set them synchronously (see onEnded below). `null`
  // marks an in-flight resolution so we don't kick it off twice.
  const blobUrlRef = useRef<Map<string, string | null>>(new Map());
  // True while we're deliberately swapping audio.src for a track change.
  // Setting .src on a playing element fires a native 'pause' event before the
  // new source starts — without this guard that would look identical to an
  // external interruption (OS sleep, lost audio focus) and wrongly flip the
  // store to paused. See onNativePause below.
  const switchingRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const { playing, vol, muted, setTime, setPlaying } = usePlayerStore(
    useShallow((s) => ({
      playing: s.playing,
      vol: s.vol,
      muted: s.muted,
      setTime: s.setTime,
      setPlaying: s.setPlaying,
    })),
  );

  const currentId = usePlayerStore((s) => s.queue[s.pos]);
  const currentTrack = usePlayerStore((s): Track | undefined => {
    const id = s.queue[s.pos];
    return s.tracks.find((t) => t.id === id);
  });

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;
    setAudioEl(audio);
    return () => {
      audio.pause();
      audio.src = '';
      setAudioEl(null);
      for (const a of prefetchRef.current.values()) a.src = '';
      prefetchRef.current.clear();
      for (const url of blobUrlRef.current.values()) if (url) URL.revokeObjectURL(url);
      blobUrlRef.current.clear();
    };
  }, []);

  // Playback control — handles both track changes and play/pause. Gesture-adjacent
  // (playTrack/prev/next-button/shuffle), so it's fine for this to resolve async.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentId) return;
    let cancelled = false;

    (async () => {
      if (prevIdRef.current !== currentId) {
        const prevId = prevIdRef.current;
        if (prevId) {
          const { tracks, lastChangeWasSkip } = usePlayerStore.getState();
          const prevTrack = tracks.find((t) => t.id === prevId);
          const duration = audio.duration || prevTrack?.durationSec || 0;
          reportPlayback(prevId, audio.currentTime, duration, lastChangeWasSkip);
        }
        prevIdRef.current = currentId;

        let src = blobUrlRef.current.get(currentId) || null;
        if (!src && useOfflineStore.getState().downloaded[currentId]) {
          src = await getCachedTrackBlobUrl(currentId);
          if (cancelled) { if (src) URL.revokeObjectURL(src); return; }
          if (src) blobUrlRef.current.set(currentId, src);
        }
        switchingRef.current = true;
        audio.src = src || streamUrl(currentId);
        if (playing) {
          audio.play()
            .then(() => { switchingRef.current = false; setMediaPlaybackState('playing'); })
            .catch(() => { switchingRef.current = false; setPlaying(false); });
        } else {
          switchingRef.current = false;
        }
      } else if (playing) {
        audio.play().then(() => setMediaPlaybackState('playing')).catch(() => setPlaying(false));
      } else {
        audio.pause();
        setMediaPlaybackState('paused');
      }
    })();

    return () => { cancelled = true; };
  }, [currentId, playing, setPlaying]);

  // Volume / mute — on phones there's no in-app control, volume is system-managed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => {
      audio.volume = mq.matches ? 1 : vol;
      audio.muted = mq.matches ? false : muted;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [vol, muted]);

  // Screen Wake Lock while playing — audio alone doesn't stop a laptop/phone
  // from going to sleep, and once the system suspends the audio pipeline dies
  // with it (caught above by onNativePause). This is best-effort: the lock is
  // auto-released by the browser whenever the tab is hidden, so it can't help
  // background-tab playback, only the "screen times out while the player tab
  // is on top" case.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let cancelled = false;
    const release = () => {
      const sentinel = wakeLockRef.current;
      wakeLockRef.current = null;
      sentinel?.release().catch(() => {});
    };
    const acquire = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then((sentinel) => {
        if (cancelled) { sentinel.release().catch(() => {}); return; }
        wakeLockRef.current = sentinel;
      }).catch(() => { /* unsupported/denied — best effort */ });
    };
    if (playing) acquire(); else release();
    const onVisibility = () => { if (playing) acquire(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [playing]);

  // Auto-pause when an audio output device disappears (e.g. Bluetooth
  // headphones switching off). Browsers don't reliably fire a native 'pause'
  // for this on their own — the OS just re-routes to the next output — so we
  // watch the device list ourselves and stop playback on a drop.
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    let prevCount: number | null = null;
    const check = () => {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const count = devices.filter((d) => d.kind === 'audiooutput').length;
        if (prevCount != null && count < prevCount && !audioRef.current?.paused) {
          usePlayerStore.getState().setPlaying(false);
        }
        prevCount = count;
      }).catch(() => { /* enumerateDevices unavailable without permission */ });
    };
    check();
    navigator.mediaDevices.addEventListener('devicechange', check);
    return () => navigator.mediaDevices.removeEventListener('devicechange', check);
  }, []);

  // Evict prefetch entries (network audio + prepared blob URLs) that fell out
  // of the upcoming window. Includes the current track (i=0) so its blob URL
  // (the one live in audio.src right now) never gets revoked out from under it.
  useEffect(() => {
    const { queue, pos } = usePlayerStore.getState();
    const nextSet = new Set(
      Array.from({ length: PREFETCH_COUNT + 1 }, (_, i) => queue[(pos + i) % queue.length])
        .filter(Boolean),
    );
    for (const [id, a] of prefetchRef.current) {
      if (!nextSet.has(id)) { a.src = ''; prefetchRef.current.delete(id); }
    }
    for (const [id, url] of blobUrlRef.current) {
      if (!nextSet.has(id)) {
        if (url) URL.revokeObjectURL(url);
        blobUrlRef.current.delete(id);
      }
    }
  }, [currentId]);

  // Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(Math.floor(audio.currentTime));
    // Advance + play synchronously inside the native 'ended' handler — mobile
    // browsers (notably iOS Safari) only allow starting the next track without
    // a fresh user gesture if play() is called in the same tick as 'ended'.
    // Routing this through a React effect (via store.next()) adds a scheduling
    // hop that gets throttled once the screen locks, so the next track never starts.
    // This also means the next track's blob URL must already be prepared (see
    // onCanPlayThrough below) — there's no time here to await Cache Storage.
    const onEnded = () => {
      const { queue, pos, tracks } = usePlayerStore.getState();
      if (!queue.length) return;

      const endedId = queue[pos];
      const endedTrack = tracks.find((t) => t.id === endedId);
      const duration = audio.duration || endedTrack?.durationSec || 0;
      reportPlayback(endedId, duration, duration, false);

      const nextPos = findPlayableIndex(queue, pos, useOfflineStore.getState().downloaded, 1);
      if (nextPos == null) {
        usePlayerStore.getState().flash('Нет скачанных треков в очереди');
        usePlayerStore.setState({ playing: false });
        return;
      }

      const nextId = queue[nextPos];
      const readyBlobUrl = blobUrlRef.current.get(nextId);
      if (!isOnline() && !readyBlobUrl) {
        // Downloaded but its blob URL hasn't resolved from Cache Storage yet — falling
        // back to streamUrl would hit the network, which fails while offline, and would
        // also wedge prevIdRef so the reactive effect below never retries this track.
        // Leave src/prevIdRef untouched and let the "Playback control" effect (which can
        // await the cache read) pick it up once pos changes.
        usePlayerStore.setState({ pos: nextPos, time: 0, lastChangeWasSkip: false });
        return;
      }
      prevIdRef.current = nextId;
      switchingRef.current = true;
      audio.src = readyBlobUrl || streamUrl(nextId);
      audio.play()
        .then(() => { switchingRef.current = false; setMediaPlaybackState('playing'); })
        .catch(() => { switchingRef.current = false; usePlayerStore.getState().setPlaying(false); });
      // Force playing back to true here, not just pos/time: the native 'pause'
      // that precedes 'ended' (see onNativePause) can race ahead of switchingRef
      // on a throttled background tab (screen-locked phone) — audio.ended may
      // still read false when that pause fires, so onNativePause flips playing
      // to false right before this runs. Since we're unconditionally starting
      // the next track above, playing must be true regardless of that race, or
      // the reactive playback-control effect immediately re-pauses this track.
      usePlayerStore.setState({ pos: nextPos, time: 0, playing: true, lastChangeWasSkip: false });
    };
    const onCanPlayThrough = () => {
      const { queue, pos, tracks } = usePlayerStore.getState();
      const trackIds = new Set(tracks.map((t) => t.id));
      const { downloaded } = useOfflineStore.getState();
      const audioCache = prefetchRef.current;
      const blobCache = blobUrlRef.current;
      for (let i = 1; i <= PREFETCH_COUNT; i++) {
        const id = queue[(pos + i) % queue.length];
        if (!id || !trackIds.has(id)) continue;
        if (downloaded[id]) {
          if (!blobCache.has(id)) {
            blobCache.set(id, null);
            getCachedTrackBlobUrl(id).then((url) => {
              if (url) blobCache.set(id, url);
              else blobCache.delete(id);
            });
          }
        } else if (!audioCache.has(id)) {
          const a = new Audio();
          a.preload = 'auto';
          a.src = streamUrl(id);
          audioCache.set(id, a);
        }
      }
    };
    // The browser can pause the element on its own — OS sleep/resume, lost
    // audio focus (phone call, another app), or the active output device
    // disappearing (e.g. Bluetooth headphones switching off). Previously
    // nothing listened for that, so the store kept reporting `playing: true`
    // while audio had actually stopped: the UI looked live but was silent,
    // and on phones the fix was to tap pause then play to force a resync.
    // switchingRef distinguishes that from the synchronous 'pause' our own
    // track-change src swap fires (see switchingRef comment above). audio.ended
    // covers a second false positive: browsers fire 'pause' before 'ended' when
    // playback finishes naturally, which would otherwise flip playing to false
    // right as onEnded is starting the next track, causing the reactive
    // playback-control effect to immediately re-pause it.
    const onNativePause = () => {
      if (switchingRef.current || audio.ended) return;
      usePlayerStore.getState().setPlaying(false);
      setMediaPlaybackState('paused');
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    audio.addEventListener('pause', onNativePause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
      audio.removeEventListener('pause', onNativePause);
    };
  }, [setTime]);

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      ...(currentTrack.album ? { album: currentTrack.album } : {}),
      artwork: currentTrack.hasCover
        ? [{ src: `/api/cover/${currentTrack.id}`, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    });
    navigator.mediaSession.setActionHandler('play', () => setPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setPlaying(false));
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().next());
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prev());
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d.seekTime != null) usePlayerStore.getState().seek(d.seekTime);
    });
  }, [currentTrack, setPlaying]);
}
