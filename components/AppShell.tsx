'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore, lsLoad, lsSave } from '@/store/player';
import { useAudio } from '@/hooks/use-audio';
import Ic from '@/components/ui/Ic';
import Player from '@/components/player/Player';
import QueuePanel from '@/components/player/QueuePanel';
import type { Track } from '@/types';

const NAV = [
  { href: '/', icon: 'home', label: 'Главная' },
  { href: '/library', icon: 'grid', label: 'Медиа' },
  { href: '/search', icon: 'search', label: 'Поиск' },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { queue, pos, vol, dark, showQ, toast } = usePlayerStore(
    useShallow((s) => ({
      queue: s.queue,
      pos: s.pos,
      vol: s.vol,
      dark: s.dark,
      showQ: s.showQ,
      toast: s.toast,
    })),
  );

  useAudio();

  // Hydrate from localStorage on mount
  useEffect(() => {
    usePlayerStore.setState(lsLoad());
  }, []);

  // Load tracks from API
  useEffect(() => {
    fetch('/api/tracks')
      .then((r) => r.json())
      .then((tracks: Track[]) => usePlayerStore.getState().setTracks(tracks))
      .catch(() => { /* no music dir yet — library stays empty */ });
  }, []);

  // Pick a random backdrop once per page load
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    fetch(`/api/backdrops?theme=${theme}`)
      .then((r) => r.json())
      .then((files: string[]) => {
        if (!files.length) return;
        const file = files[Math.floor(Math.random() * files.length)];
        document.documentElement.style.setProperty(
          '--bg',
          `url(/backdrop/${theme}/${encodeURIComponent(file)})`,
        );
      })
      .catch(() => { /* keep CSS gradient fallback */ });
  }, []);

  // Persist to localStorage
  useEffect(() => { lsSave('queue', queue); }, [queue]);
  useEffect(() => { lsSave('pos', pos); }, [pos]);
  useEffect(() => { lsSave('vol', vol); }, [vol]);
  useEffect(() => { lsSave('dark', dark); }, [dark]);

  // Apply theme
  useEffect(() => {
    const el = document.documentElement;
    if (dark === true) el.setAttribute('data-theme', 'dark');
    else if (dark === false) el.setAttribute('data-theme', 'light');
    else el.removeAttribute('data-theme');
  }, [dark]);

  return (
    <>
      {/* SVG filter for liquid glass refraction — Chromium only */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
        <defs>
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feImage
              result="map"
              x="0%" y="0%" width="100%" height="100%"
              preserveAspectRatio="none"
              xlinkHref="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSIyMCIgZmlsbD0idXJsKCNhKSIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIxODAiIHJ4PSIyMCIgZmlsbD0idXJsKCNiKSIgc3R5bGU9Im1peC1ibGVuZC1tb2RlOmRpZmZlcmVuY2UiLz48cmVjdCB4PSIyNSIgeT0iMjUiIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiByeD0iMTQiIGZpbGw9IiM4Nzg3ODciIGZpbHRlcj0idXJsKCNnKSIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iYSI+PHN0b3Agc3RvcC1jb2xvcj0iIzAwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2YwMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJiIiB4MT0iMCIgeTE9IjAiIHgyPSIwIiB5Mj0iMSI+PHN0b3Agc3RvcC1jb2xvcj0iIzAwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzAwZiIvPjwvbGluZWFyR3JhZGllbnQ+PGZpbHRlciBpZD0iZyI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iNiIvPjwvZmlsdGVyPjwvZGVmcz48L3N2Zz4="
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={80}
              xChannelSelector="R"
              yChannelSelector="B"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="0.5" />
          </filter>
        </defs>
      </svg>

      {/* Frame background */}
      <div className="frame-bg" aria-hidden />

      {/* App shell */}
      <div className="app">
        {/* Left nav (desktop + tablet) */}
        <nav className="nav glass refract" aria-label="Навигация">
          {NAV.map(({ href, icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-btn${pathname === href ? ' on' : ''}`}
              aria-label={icon}
            >
              <Ic n={icon} className="w-[22px] h-[22px]" />
            </Link>
          ))}
        </nav>

        {/* Content */}
        <main className="content scrollbar-none">
          {children}
        </main>

        {/* Phone tab bar */}
        <nav className="tabbar glass refract" aria-label="Вкладки">
          {NAV.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`tab-btn${pathname === href ? ' on' : ''}`}
            >
              <Ic n={icon} className="w-[21px] h-[21px]" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Player */}
      <Player />

      {/* Queue panel */}
      {showQ && <QueuePanel />}

      {/* Toast */}
      {toast && <div className="toast glass">{toast}</div>}
    </>
  );
}
