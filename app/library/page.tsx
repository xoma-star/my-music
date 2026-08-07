'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '@/store/player';
import { useOfflineStore } from '@/store/offline';
import TrackRow from '@/components/library/TrackRow';

// Matches .row's rendered height: 46px art + 9px*2 vertical padding
const ROW_HEIGHT = 64;
// Matches .list's padding: 8px
const LIST_PADDING = 8;

type SortMode = 'default' | 'rating-desc' | 'rating-asc';

export default function LibraryPage() {
  const tracks = usePlayerStore((s) => s.tracks);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [toggling, setToggling] = useState(false);
  const [sort, setSort] = useState<SortMode>('default');

  const sortedTracks = useMemo(() => {
    if (sort === 'default') return tracks;
    const sign = sort === 'rating-desc' ? -1 : 1;
    return [...tracks].sort((a, b) => sign * (a.rating - b.rating));
  }, [tracks, sort]);

  const { offlineEnabled, downloaded, downloading } = useOfflineStore(
    useShallow((s) => ({ offlineEnabled: s.enabled, downloaded: s.downloaded, downloading: s.downloading })),
  );
  const downloadedCount = Object.keys(downloaded).length;
  const isSyncing = Object.keys(downloading).length > 0;

  const onToggleOffline = async () => {
    setToggling(true);
    try {
      await useOfflineStore.getState().setEnabled(!offlineEnabled, tracks);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    setScrollEl(listRef.current?.closest<HTMLElement>('.content') ?? null);
  }, []);

  const virtualizer = useVirtualizer({
    count: sortedTracks.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <div className="page">
      <div className="head">
        <h1>Библиотека</h1>
        <div className="sub">{tracks.length} треков</div>
        <div className="offline-row">
          <button
            className={`switch${offlineEnabled ? ' on' : ''}`}
            disabled={toggling}
            onClick={onToggleOffline}
            aria-label="Оффлайн"
            aria-pressed={offlineEnabled}
          />
          <div>
            <div className="lbl">Оффлайн</div>
            <div className="sub2">
              {offlineEnabled
                ? isSyncing
                  ? `Загрузка… ${downloadedCount}/${tracks.length}`
                  : `Скачано ${downloadedCount}/${tracks.length}`
                : 'Треки хранятся только на сервере'}
            </div>
          </div>
        </div>
        <div className="sort-row">
          <span className="sort-lbl">Сортировка</span>
          <div className="seg">
            <button className={sort === 'default' ? 'active' : ''} onClick={() => setSort('default')}>
              По умолчанию
            </button>
            <button className={sort === 'rating-desc' ? 'active' : ''} onClick={() => setSort('rating-desc')}>
              Рейтинг ↓
            </button>
            <button className={sort === 'rating-asc' ? 'active' : ''} onClick={() => setSort('rating-asc')}>
              Рейтинг ↑
            </button>
          </div>
        </div>
      </div>
      {sortedTracks.length > 0 && (
        <div
          ref={listRef}
          className="list glass refract"
          style={{ position: 'relative', height: virtualizer.getTotalSize() + LIST_PADDING * 2 }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const track = sortedTracks[vi.index];
            return (
              <div
                key={track.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: vi.size,
                  transform: `translateY(${vi.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <TrackRow track={track} index={vi.index} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}