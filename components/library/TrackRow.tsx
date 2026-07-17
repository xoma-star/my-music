'use client';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import { fmt } from '@/lib/data';
import type { Track } from '@/types';
import Art from '@/components/ui/Art';
import Ic from '@/components/ui/Ic';
import RatingControl from '@/components/ui/RatingControl';
import DownloadBadge from '@/components/ui/DownloadBadge';

interface Props {
  track: Track;
  index: number;
  showNumber?: boolean;
}

export default function TrackRow({ track, index, showNumber = true }: Props) {
  const { queue, pos, playing, playTrack, addToQueue, setRating } = usePlayerStore(
    useShallow((s) => ({
      queue: s.queue,
      pos: s.pos,
      playing: s.playing,
      playTrack: s.playTrack,
      addToQueue: s.addToQueue,
      setRating: s.setRating,
    })),
  );

  const isActive = queue[pos] === track.id;
  const isPlaying = isActive && playing;

  return (
    <div
      className={`row${isActive ? ' playing' : ''}`}
      onClick={() => playTrack(track.id)}
    >
      <div className="idx">
        {isPlaying ? (
          <Ic n="wave" style={{ width: 14, height: 14 }} />
        ) : showNumber ? (
          index + 1
        ) : (
          '♪'
        )}
      </div>
      <Art id={track.id} hasCover={track.hasCover} className="w-[46px] h-[46px]" />
      <div className="meta">
        <div className="t">{track.title}</div>
        <div className="a">{track.artist}</div>
      </div>
      <RatingControl trackId={track.id} rating={track.rating} onChange={setRating} />
      <DownloadBadge trackId={track.id} />
      <div className="rowbtns">
        <button
          className="qadd"
          title="В очередь"
          onClick={(e) => { e.stopPropagation(); addToQueue(track.id); }}
        >
          <Ic n="plus" className="w-[17px] h-[17px]" />
        </button>
      </div>
      <div className="dur">{fmt(track.durationSec)}</div>
    </div>
  );
}
