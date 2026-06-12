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
  title: 'CultureQuest',
  description: 'Video platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CultureQuest',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

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
      </body>
    </html>
  );
}