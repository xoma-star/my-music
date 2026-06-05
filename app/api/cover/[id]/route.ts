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
    const isWebP = data.length > 12 &&
      data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
      data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50;
    return new Response(data, {
      headers: {
        'Content-Type': isWebP ? 'image/webp' : 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
