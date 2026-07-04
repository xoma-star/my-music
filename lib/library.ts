import fs from 'fs';
import path from 'path';
import type { Track } from '@/types';
import { getAllRatings } from './ratings';

const CACHE_DIR = process.env.CACHE_DIR ?? path.join(process.cwd(), 'data', 'cache');

type RawTrack = Omit<Track, 'rating' | 'weight'>;

let cache: RawTrack[] | null = null;
let cacheMtime = 0;

function readRaw(): RawTrack[] {
  const file = path.join(CACHE_DIR, 'library.json');
  try {
    const mtime = fs.statSync(file).mtimeMs;
    if (cache && mtime === cacheMtime) return cache;
    cache = JSON.parse(fs.readFileSync(file, 'utf-8')) as RawTrack[];
    cacheMtime = mtime;
    return cache;
  } catch {
    return [];
  }
}

export function getLibrary(): Track[] {
  const ratings = getAllRatings();
  return readRaw().map((t) => {
    const r = ratings.get(t.id);
    return { ...t, rating: r?.rating ?? 0, weight: r?.weight ?? 1 };
  });
}

export function getCoverPath(id: string): string {
  return path.join(CACHE_DIR, 'covers', `${id}.jpg`);
}

export const MUSIC_DIR = process.env.MUSIC_DIR ?? path.join(process.cwd(), 'data', 'music');
