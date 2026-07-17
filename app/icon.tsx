import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 14,
        }}
      >
        <span style={{ fontSize: 36, color: '#fff' }}>♪</span>
      </div>
    ),
    { ...size },
  );
}
