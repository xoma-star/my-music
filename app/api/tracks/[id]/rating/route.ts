import { NextRequest, NextResponse } from 'next/server';
import { getLibrary } from '@/lib/library';
import { setRating } from '@/lib/ratings';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!getLibrary().some((t) => t.id === id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { rating?: number } | null;
  if (typeof body?.rating !== 'number' || !Number.isFinite(body.rating)) {
    return NextResponse.json({ error: 'invalid rating' }, { status: 400 });
  }

  return NextResponse.json(setRating(id, body.rating));
}
