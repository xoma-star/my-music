import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLibrary, MUSIC_DIR } from '@/lib/library';

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  opus: 'audio/ogg; codecs=opus',
  wav: 'audio/wav',
};

function parseRange(header: string, size: number): [number, number] {
  const m = header.match(/bytes=(\d*)-(\d*)/);
  if (!m) return [0, size - 1];
  const start = m[1] ? parseInt(m[1], 10) : 0;
  const end = m[2] ? parseInt(m[2], 10) : size - 1;
  return [start, Math.min(end, size - 1)];
}

function nodeToWeb(stream: fs.ReadStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk as Uint8Array));
      stream.on('end', () => controller.close());
      stream.on('error', (e) => controller.error(e));
    },
    cancel() { stream.destroy(); },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const track = getLibrary().find((t) => t.id === id);
  if (!track) return new Response('Not found', { status: 404 });

  const filePath = path.join(MUSIC_DIR, track.path);
  let stat: fs.Stats;
  try { stat = fs.statSync(filePath); } catch {
    return new Response('File not found', { status: 404 });
  }

  const size = stat.size;
  const mime = MIME[track.codec.toLowerCase()] ?? 'audio/mpeg';
  const rangeHeader = req.headers.get('range');

  if (rangeHeader) {
    const [start, end] = parseRange(rangeHeader, size);
    return new Response(nodeToWeb(fs.createReadStream(filePath, { start, end })), {
      status: 206,
      headers: {
        'Content-Type': mime,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(nodeToWeb(fs.createReadStream(filePath)), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(size),
      'Cache-Control': 'no-store',
    },
  });
}
