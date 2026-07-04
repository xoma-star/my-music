import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const CACHE_DIR = process.env.CACHE_DIR ?? path.join(process.cwd(), 'data', 'cache');

const RATING_MIN = -5;
const RATING_MAX = 5;

export interface RatingRow {
  rating: number;
  weight: number;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  db = new Database(path.join(CACHE_DIR, 'ratings.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      rating REAL NOT NULL DEFAULT 0,
      weight REAL NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );
  `);
  return db;
}

function clamp(rating: number): number {
  return Math.max(RATING_MIN, Math.min(RATING_MAX, rating));
}

function upsert(id: string, rating: number): RatingRow {
  const clamped = clamp(rating);
  const weight = 2 ** clamped;
  getDb()
    .prepare(`
      INSERT INTO ratings (id, rating, weight, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET rating = excluded.rating, weight = excluded.weight, updated_at = excluded.updated_at
    `)
    .run(id, clamped, weight, Date.now());
  return { rating: clamped, weight };
}

export function getAllRatings(): Map<string, RatingRow> {
  const rows = getDb()
    .prepare('SELECT id, rating, weight FROM ratings')
    .all() as Array<{ id: string; rating: number; weight: number }>;
  return new Map(rows.map((r) => [r.id, { rating: r.rating, weight: r.weight }]));
}

export function getRating(id: string): RatingRow {
  const row = getDb()
    .prepare('SELECT rating, weight FROM ratings WHERE id = ?')
    .get(id) as { rating: number; weight: number } | undefined;
  return row ?? { rating: 0, weight: 1 };
}

export function setRating(id: string, rating: number): RatingRow {
  return upsert(id, rating);
}

export function adjustRating(id: string, delta: number): RatingRow {
  return upsert(id, getRating(id).rating + delta);
}
