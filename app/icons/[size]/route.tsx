import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Stable-URL icon generator (used by app/manifest.ts) — no design assets in
// the repo yet, so this is a placeholder glyph matching the app's palette.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const px = Math.max(32, Math.min(1024, parseInt(size, 10) || 512));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #2d1b33 0%, #1f2d1a 55%, #ff8a3d 140%)',
        }}
      >
        <span style={{ fontSize: px * 0.56, color: '#fff' }}>♪</span>
      </div>
    ),
    { width: px, height: px },
  );
}
