import React from 'react';
import './globals.css';
import ClientShell from '../components/layout/ClientShell';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: 'JuneteenthTube',
  description: 'Video platform',
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