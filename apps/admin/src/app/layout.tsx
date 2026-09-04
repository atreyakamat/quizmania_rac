import React from 'react';
import './globals.css';
import { AdminShell } from '@/components/AdminShell';

export const metadata = {
  title: 'QuizMania Admin Studio - Rotaract Club of Mapusa',
  description: 'Private administration panel for QuizMania',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF8F9] min-h-screen antialiased">
        <AdminShell>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
