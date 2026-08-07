import { NextRequest, NextResponse } from 'next/server';
import { getLibrary } from '@/lib/library';
import { adjustRating } from '@/lib/ratings';

const EARLY_SKIP_DELTA = -0.3;
const COMPLETION_BONUS = 0.15;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const track = getLibrary().find((t) => t.id === id);
  if (!track) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const body = (await req.json().catch(() => null)) as
    | { playedSec?: number; durationSec?: number }
    | null;
  const playedSec = typeof body?.playedSec === 'number' ? body.playedSec : 0;
  const durationSec =
    typeof body?.durationSec === 'number' && body.durationSec > 0
      ? body.durationSec
      : track.durationSec;

  if (!durationSec) return NextResponse.json({ ok: true });

  // Long tracks would otherwise get a multi-minute "early skip" grace window at 25%.
  const earlySkipThreshold = Math.min(durationSec * 0.25, 7);

  let delta = 0;
  if (playedSec >= durationSec * 0.5) delta = COMPLETION_BONUS;
  else if (playedSec < earlySkipThreshold) delta = EARLY_SKIP_DELTA;

  if (delta === 0) return NextResponse.json({ ok: true });

  return NextResponse.json(adjustRating(id, delta));
}
