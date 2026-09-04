import React from 'react';
import './globals.css';
import { AdminSidebar } from '@/components/AdminSidebar';

export const metadata = {
  title: 'Quiz Management Platform - Admin',
  description: 'Private administration panel for Quiz Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex antialiased">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
