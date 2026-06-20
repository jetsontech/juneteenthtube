import React from 'react';
import './globals.css';
import ClientShell from '../components/layout/ClientShell';
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f0f0f',
};

export const metadata = {
  title: 'CultureQuest | Black Heritage Streaming Platform',
  description: 'CultureQuest is an AI-native streaming platform preserving and celebrating Black cultural heritage. Watch documentaries, parades, music, speeches, and community archives — all in one place.',
  keywords: ['CultureQuest', 'Black heritage', 'cultural streaming', 'documentaries', 'Juneteenth', 'African American history'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CultureQuest',
  },
  openGraph: {
    title: 'CultureQuest | Black Heritage Streaming Platform',
    description: 'AI-native streaming platform preserving and celebrating Black cultural heritage through community-driven media archives, documentaries, and live cultural programming.',
    siteName: 'CultureQuest',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CultureQuest | Black Heritage Streaming',
    description: 'Stream Black heritage. Documentaries, parades, music, speeches & community archives.',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientShell>
          {children}
          <SpeedInsights />
        </ClientShell>
        <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff', fontSize: '14px', borderRadius: '8px' } }} />
      </body>
    </html>
  );
}