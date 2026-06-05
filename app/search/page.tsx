'use client';
import { useState } from 'react';
import { usePlayerStore } from '@/store/player';
import TrackRow from '@/components/library/TrackRow';
import Ic from '@/components/ui/Ic';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const tracks = usePlayerStore((s) => s.tracks);

  const filtered = q.trim()
    ? tracks.filter((t) =>
        `${t.title} ${t.artist}`.toLowerCase().includes(q.toLowerCase()),
      )
    : [];

  return (
    <div className="page">
      <div className="head">
        <h1>Поиск</h1>
      </div>

      <div className="searchbar glass refract">
        <Ic n="search" className="w-5 h-5 flex-none text-white/60" />
        <input
          autoFocus
          placeholder="Найти трек или исполнителя…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-white text-[16px] placeholder:text-white/50"
        />
        {q && (
          <button
            className="qadd"
            style={{ opacity: 1 }}
            onClick={() => setQ('')}
          >
            <Ic n="close" className="w-[17px] h-[17px]" />
          </button>
        )}
      </div>

      {!q.trim() ? (
        <div className="empty">
          <div className="ico">
            <Ic n="wave" className="w-[34px] h-[34px]" />
          </div>
          <h2>Что хотите послушать?</h2>
          <p>Начните вводить название трека или имя исполнителя.</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="list glass refract">
          {filtered.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} showNumber={false} />
          ))}
        </div>
      ) : (
        <div className="nores">Ничего не найдено по запросу «{q}»</div>
      )}
    </div>
  );
}
