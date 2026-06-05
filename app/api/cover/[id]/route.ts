import { NextRequest } from 'next/server';
import fs from 'fs';
import { getCoverPath } from '@/lib/library';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const coverPath = getCoverPath(id);
  try {
    const data = fs.readFileSync(coverPath);
    return new Response(data, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
