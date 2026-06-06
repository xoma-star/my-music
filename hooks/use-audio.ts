'use client';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import { setAudioEl } from '@/lib/audio';
import type { Track } from '@/types';

const PREFETCH_COUNT = 5;

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdRef = useRef<string | undefined>(undefined);
  const prefetchRef = useRef<Map<string, HTMLAudioElement>>(new Map());

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
    };
  }, []);

  // Playback control — handles both track changes and play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentId) return;

    if (prevIdRef.current !== currentId) {
      prevIdRef.current = currentId;
      audio.src = `/api/stream/${currentId}`;
      if (playing) audio.play().catch(() => setPlaying(false));
    } else {
      if (playing) {
        audio.play().catch(() => setPlaying(false));
      } else {
        audio.pause();
      }
    }
  }, [currentId, playing, setPlaying]);

  // Volume / mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = vol;
    audio.muted = muted;
  }, [vol, muted]);

  // Evict prefetch entries that fell out of the upcoming window
  useEffect(() => {
    const { queue, pos } = usePlayerStore.getState();
    const nextSet = new Set(
      Array.from({ length: PREFETCH_COUNT }, (_, i) => queue[(pos + 1 + i) % queue.length])
        .filter(Boolean),
    );
    for (const [id, a] of prefetchRef.current) {
      if (!nextSet.has(id)) { a.src = ''; prefetchRef.current.delete(id); }
    }
  }, [currentId]);

  // Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(Math.floor(audio.currentTime));
    const onEnded = () => usePlayerStore.getState().next();
    const onCanPlayThrough = () => {
      const { queue, pos, tracks } = usePlayerStore.getState();
      const trackIds = new Set(tracks.map((t) => t.id));
      const cache = prefetchRef.current;
      for (let i = 1; i <= PREFETCH_COUNT; i++) {
        const id = queue[(pos + i) % queue.length];
        if (id && !cache.has(id) && trackIds.has(id)) {
          const a = new Audio();
          a.preload = 'auto';
          a.src = `/api/stream/${id}`;
          cache.set(id, a);
        }
      }
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
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
