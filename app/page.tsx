'use client';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import Ic from '@/components/ui/Ic';

export default function HomePage() {
  const { playing, togglePlaying, shuffle } = usePlayerStore(
    useShallow((s) => ({ playing: s.playing, togglePlaying: s.togglePlaying, shuffle: s.shuffle })),
  );

  return (
    <div className="page home">
      <div className="home-btns">
        <button className="big-play glass refract" onClick={togglePlaying}>
          <Ic n={playing ? 'pause' : 'play'} className="big-play-icon" />
        </button>
        <button className="pill-btn glass refract" onClick={shuffle}>
          Случайно
        </button>
      </div>
    </div>
  );
}
