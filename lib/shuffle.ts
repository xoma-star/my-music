import type { Track } from '@/types';

// Efraimidis–Spirakis weighted sampling: key = ln(U) / weight, sort desc.
// Higher weight -> key closer to 0 -> sorts earlier, without ever excluding low-weight tracks.
export function weightedShuffleIds(tracks: Track[]): string[] {
  return tracks
    .map((t) => ({ id: t.id, key: Math.log(Math.random()) / (t.weight || 1) }))
    .sort((a, b) => b.key - a.key)
    .map((t) => t.id);
}
