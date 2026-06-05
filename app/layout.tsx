import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Player',
  description: 'Liquid Glass Music Player',
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
