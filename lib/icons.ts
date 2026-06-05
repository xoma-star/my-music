export const icons = {
  home: '<path d="M3 10.2 12 3l9 7.2"/><path d="M5 9v11h5v-6h4v6h5V9"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor" stroke="none"/>',
  prev: '<path d="M7 5v14" stroke-width="2.2"/><path d="M19 5 9 12l10 7z" fill="currentColor" stroke="none"/>',
  next: '<path d="M17 5v14" stroke-width="2.2"/><path d="M5 5l10 7-10 7z" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>',
  volMute: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none"/><path d="m17 9 4 6M21 9l-4 6"/>',
  queue: '<path d="M4 6h11M4 12h11M4 18h7"/><path d="M17 14v6l5-3z" fill="currentColor" stroke="none"/>',
  wave: '<rect x="3" y="9" width="2.4" height="6" rx="1.2" fill="currentColor" stroke="none"/><rect x="7.5" y="5" width="2.4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="12" y="2" width="2.4" height="20" rx="1.2" fill="currentColor" stroke="none"/><rect x="16.5" y="6" width="2.4" height="12" rx="1.2" fill="currentColor" stroke="none"/><rect x="19.2" y="9.5" width="2.4" height="5" rx="1.2" fill="currentColor" stroke="none"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" fill="currentColor"/>',
} as const;

export type IconName = keyof typeof icons;
