'use client';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import Art from '@/components/ui/Art';
import Ic from '@/components/ui/Ic';

export default function QueuePanel() {
  const { queue, pos, tracks, removeFromQueue, toggleShowQ } = usePlayerStore(
    useShallow((s) => ({
      queue: s.queue,
      pos: s.pos,
      tracks: s.tracks,
      removeFromQueue: s.removeFromQueue,
      toggleShowQ: s.toggleShowQ,
    })),
  );

  const cur = tracks.find((t) => t.id === queue[pos]);
  const upcoming = queue.slice(pos + 1);

  const goTo = (queueIdx: number) => {
    usePlayerStore.setState({ pos: queueIdx, time: 0, playing: true });
  };

  return (
    <div className="queue glass refract">
      <h3>
        Очередь
        <button className="qclose" onClick={toggleShowQ}>
          <Ic n="close" />
        </button>
      </h3>
      <div className="qlist">
        <div className="qsec">Сейчас играет</div>
        {cur && (
          <div className="qrow playing">
            <Art id={cur.id} hasCover={cur.hasCover} className="w-[38px] h-[38px]" />
            <div className="info">
              <div className="t">{cur.title}</div>
              <div className="a">{cur.artist}</div>
            </div>
          </div>
        )}

        <div className="qsec">Далее · {upcoming.length}</div>

        {upcoming.length === 0 ? (
          <div className="qempty">Очередь пуста</div>
        ) : (
          upcoming.map((id, j) => {
            const t = tracks.find((tr) => tr.id === id);
            if (!t) return null;
            const qIdx = pos + 1 + j;
            return (
              <div key={`${qIdx}_${id}`} className="qrow" onClick={() => goTo(qIdx)}>
                <Art id={t.id} hasCover={t.hasCover} className="w-[38px] h-[38px]" />
                <div className="info">
                  <div className="t">{t.title}</div>
                  <div className="a">{t.artist}</div>
                </div>
                <button
                  className="rm"
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(qIdx); }}
                >
                  <Ic n="close" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
