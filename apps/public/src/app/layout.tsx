import React from 'react';
import './globals.css';
import { QuizManiaNavbar } from '@/components/QuizManiaNavbar';
import { QuizManiaFooter } from '@/components/QuizManiaFooter';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://quizmania.atreyakamat.dev'),
  title: {
    default: 'QuizMania — Rotaract Club of Mapusa',
    template: '%s | QuizMania'
  },
  description: 'Think Fast. Learn More. Compete Together. Interactive quiz platform by Rotaract Club of Mapusa (RI District 3170), designed & built by Atreya Kamat.',
  keywords: [
    'QuizMania',
    'Rotaract Club of Mapusa',
    'Rotary International District 3170',
    'Goa Quizzes',
    'Atreya Kamat',
    'Stix N Vibes',
    'Interactive Quiz Platform'
  ],
  authors: [{ name: 'Atreya Kamat', url: 'https://atreyakamat.dev' }],
  creator: 'Atreya Kamat',
  publisher: 'Rotaract Club of Mapusa',
  icons: {
    icon: '/branding/rotaract-mapusa-logo.png',
    apple: '/branding/rotaract-mapusa-logo.png'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quizmania.atreyakamat.dev',
    siteName: 'QuizMania',
    title: 'QuizMania — Rotaract Club of Mapusa',
    description: 'Think Fast. Learn More. Compete Together. Discover and compete in interactive community quizzes in Goa.',
    images: [
      {
        url: '/branding/rotaract-mapusa-logo.png',
        width: 800,
        height: 800,
        alt: 'QuizMania - Rotaract Club of Mapusa'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuizMania — Rotaract Club of Mapusa',
    description: 'Think Fast. Learn More. Compete Together. Interactive quiz platform designed & built by Atreya Kamat.',
    images: ['/branding/rotaract-mapusa-logo.png']
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
