import React from 'react';
import './globals.css';
import { QuizManiaNavbar } from '@/components/QuizManiaNavbar';
import { QuizManiaFooter } from '@/components/QuizManiaFooter';

export const metadata = {
  title: 'QuizMania - A Quiz Platform by Rotaract Club of Mapusa',
  description: 'Think. Play. Compete. Discover exciting quizzes and challenge yourself on QuizMania.',
  icons: {
    icon: '/branding/rotaract-mapusa-logo.png'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#FAF8F9] text-[#24141C] min-h-screen flex flex-col antialiased">
        <QuizManiaNavbar />
        <main className="flex-1">
          {children}
        </main>
        <QuizManiaFooter />
      </body>
    </html>
  );
}
