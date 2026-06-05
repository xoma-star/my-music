import fs from 'fs';
import path from 'path';
import type { Track } from '@/types';

const CACHE_DIR = process.env.CACHE_DIR ?? path.join(process.cwd(), 'data', 'cache');

let cache: Track[] | null = null;
let cacheMtime = 0;

export function getLibrary(): Track[] {
  const file = path.join(CACHE_DIR, 'library.json');
  try {
    const mtime = fs.statSync(file).mtimeMs;
    if (cache && mtime === cacheMtime) return cache;
    cache = JSON.parse(fs.readFileSync(file, 'utf-8')) as Track[];
    cacheMtime = mtime;
    return cache;
  } catch {
    return [];
  }
}

export function getCoverPath(id: string): string {
  return path.join(CACHE_DIR, 'covers', `${id}.jpg`);
}

export const MUSIC_DIR = process.env.MUSIC_DIR ?? path.join(process.cwd(), 'data', 'music');
