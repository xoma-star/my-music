'use client';
import { usePlayerStore } from '@/store/player';
import TrackRow from '@/components/library/TrackRow';

export default function LibraryPage() {
  const tracks = usePlayerStore((s) => s.tracks);

  return (
    <div className="page">
      <div className="head">
        <h1>Библиотека</h1>
        <div className="sub">{tracks.length} треков</div>
      </div>
      {tracks.length > 0 && (
        <div className="list glass refract">
          {tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
