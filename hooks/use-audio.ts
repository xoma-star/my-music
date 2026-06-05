'use client';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import { setAudioEl } from '@/lib/audio';
import type { Track } from '@/types';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdRef = useRef<string | undefined>(undefined);

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

  // Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(Math.floor(audio.currentTime));
    const onEnded = () => usePlayerStore.getState().next();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
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
