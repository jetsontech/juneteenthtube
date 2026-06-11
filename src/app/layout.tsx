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
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f0f0f',
};

export const metadata = {
  title: {
    default: 'CultureQuest — Black Cultural Streaming Platform',
    template: '%s | CultureQuest',
  },
  description: 'AI-native streaming platform preserving and celebrating Black cultural heritage through community-driven media archives, documentaries, music, speeches, and live cultural programming.',
  keywords: ['Juneteenth', 'Black culture', 'streaming', 'documentaries', 'Black history', 'African American', 'heritage', 'community media'],
  authors: [{ name: 'CultureQuest' }],
  openGraph: {
    type: 'website',
    siteName: 'CultureQuest',
    title: 'CultureQuest — Black Cultural Streaming Platform',
    description: 'Preserving and celebrating Black cultural heritage through community-driven media archives.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CultureQuest',
    description: 'Black cultural streaming platform — documentaries, music, speeches, and live programming.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CultureQuest',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  manifest: '/manifest.json',
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