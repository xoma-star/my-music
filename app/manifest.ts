import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Player — Liquid Glass Music Player',
    short_name: 'Player',
    description: 'Личный музыкальный плеер с офлайн-режимом',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a0f1f',
    theme_color: '#1a0f1f',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
