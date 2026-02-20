import React from 'react';
import './globals.css';
import ClientShell from '../components/layout/ClientShell';
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from 'next';

// Edge-to-edge display: viewport-fit=cover tells Safari to extend into the notch
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f0f0f',
};

export const metadata = {
  title: 'JuneteenthTube',
  description: 'Video platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JuneteenthTube',
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