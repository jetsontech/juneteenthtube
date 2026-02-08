import React from 'react';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SidebarProvider } from '../context/SidebarContext';
import { StateProvider } from '../context/StateContext';
import { VideoProvider } from '../context/VideoContext';

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
    <html lang='en'>
      <body>
        <AuthProvider>
          <SidebarProvider>
            <StateProvider>
              <VideoProvider>
                {children}
              </VideoProvider>
            </StateProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
