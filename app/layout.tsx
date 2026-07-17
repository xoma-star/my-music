import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Player',
  description: 'Liquid Glass Music Player',
  appleWebApp: {
    capable: true,
    title: 'Player',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a0f1f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="stage">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
