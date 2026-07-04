'use client';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import { fmt } from '@/lib/data';
import Art from '@/components/ui/Art';
import Ic from '@/components/ui/Ic';
import Slider from '@/components/ui/Slider';
import RatingControl from '@/components/ui/RatingControl';

export default function Player() {
  const {
    playing, togglePlaying,
    queue, pos, tracks,
    time, seek,
    vol, setVol,
    muted, toggleMuted,
    showQ, toggleShowQ,
    next, prev,
    setRating,
  } = usePlayerStore(
    useShallow((s) => ({
      playing: s.playing,
      togglePlaying: s.togglePlaying,
      queue: s.queue,
      pos: s.pos,
      tracks: s.tracks,
      time: s.time,
      seek: s.seek,
      vol: s.vol,
      setVol: s.setVol,
      muted: s.muted,
      toggleMuted: s.toggleMuted,
      showQ: s.showQ,
      toggleShowQ: s.toggleShowQ,
      next: s.next,
      prev: s.prev,
      setRating: s.setRating,
    })),
  );

  const cur = tracks.find((t) => t.id === queue[pos]);
  if (!cur) return null;

  return (
    <div className="player glass refract">
      {/* Now playing */}
      <div className="np">
        <Art id={cur.id} hasCover={cur.hasCover} className="w-[48px] h-[48px]" />
        <div className="info">
          <div className="t">{cur.title}</div>
          <div className="a">{cur.artist}</div>
        </div>
        <RatingControl trackId={cur.id} rating={cur.rating} onChange={setRating} />
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="btns">
          <button onClick={prev}><Ic n="prev" className="w-5 h-5" /></button>
          <button className="play" onClick={togglePlaying}>
            <Ic n={playing ? 'pause' : 'play'} className="w-6 h-6" />
          </button>
          <button onClick={next}><Ic n="next" className="w-5 h-5" /></button>
        </div>
        <div className="scrub">
          <span className="time">{fmt(time)}</span>
          <Slider
            value={cur.durationSec > 0 ? time / cur.durationSec : 0}
            onChange={(v) => seek(Math.round(v * cur.durationSec))}
          />
          <span className="time r">{fmt(cur.durationSec)}</span>
        </div>
      </div>

      {/* Extra */}
      <div className="extra">
        <div className="vol">
          <button onClick={toggleMuted}>
            <Ic n={muted || vol === 0 ? 'volMute' : 'vol'} className="w-[18px] h-[18px]" />
          </button>
          <Slider
            value={muted ? 0 : vol}
            onChange={(v) => { setVol(v); if (muted) usePlayerStore.setState({ muted: false }); }}
          />
        </div>
        <button className={`icobtn${showQ ? ' on' : ''}`} title="Очередь" onClick={toggleShowQ}>
          <Ic n="queue" className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
