import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        <span style={{ fontSize: 100, color: '#fff' }}>♪</span>
      </div>
    ),
    { ...size },
  );
}
