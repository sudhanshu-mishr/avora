import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AVORA — Ideas become reality',
  description:
    'A network for people who turn ambition into projects. Discover ideas, find collaborators, build together.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} style={{ background: 'var(--bg)' }}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}