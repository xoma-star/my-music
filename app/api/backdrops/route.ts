import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const dir = path.join(process.cwd(), 'public', 'backdrop', theme);

  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
    return NextResponse.json(files);
  } catch {
    return NextResponse.json([]);
  }
}
