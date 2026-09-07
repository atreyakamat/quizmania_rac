import React from 'react';
import './globals.css';
import { QuizManiaNavbar } from '@/components/QuizManiaNavbar';
import { QuizManiaFooter } from '@/components/QuizManiaFooter';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#A50D52',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export const metadata: Metadata = {
  metadataBase: new URL('https://quizmania.atreyakamat.dev'),
  title: {
    default: 'QuizMania — Rotaract Club of Mapusa',
    template: '%s | QuizMania — Rotaract Club of Mapusa'
  },
  description: 'Think Fast. Learn More. Compete Together. Official high-performance interactive quiz and competition platform hosted by Rotaract Club of Mapusa (RI District 3170).',
  applicationName: 'QuizMania',
  category: 'Education & Competitions',
  keywords: [
    'QuizMania',
    'Rotaract Club of Mapusa',
    'Rotary International District 3170',
    'Goa Quizzes',
    'Online Quiz Goa',
    'Student Competitions Goa',
    'Knowledge Bowl',
    'Interactive Quiz Platform'
  ],
  authors: [
    { name: 'Rotaract Club of Mapusa', url: 'https://quizmania.atreyakamat.dev' }
  ],
  creator: 'Rotaract Club of Mapusa',
  publisher: 'Rotaract Club of Mapusa',
  alternates: {
    canonical: 'https://quizmania.atreyakamat.dev'
  },
  icons: {
    icon: '/branding/quizmania.png',
    shortcut: '/branding/quizmania.png',
    apple: '/branding/quizmania.png'
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://quizmania.atreyakamat.dev',
    siteName: 'QuizMania',
    title: 'QuizMania — Rotaract Club of Mapusa',
    description: 'Think Fast. Learn More. Compete Together. Interactive community competitions and educational quizzes hosted by Rotaract Club of Mapusa (RI District 3170).',
    images: [
      {
        url: '/branding/quizmania.png',
        alt: 'QuizMania — Rotaract Club of Mapusa'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuizMania — Rotaract Club of Mapusa',
    description: 'Think Fast. Learn More. Compete Together. Official interactive quiz platform by Rotaract Club of Mapusa (RI District 3170).',
    images: ['/branding/quizmania.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://quizmania.atreyakamat.dev/#organization',
      name: 'Rotaract Club of Mapusa',
      url: 'https://quizmania.atreyakamat.dev',
      logo: {
        '@type': 'ImageObject',
        url: 'https://quizmania.atreyakamat.dev/branding/quizmania.png'
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Mapusa',
        addressRegion: 'Goa',
        addressCountry: 'India'
      },
      parentOrganization: {
        '@type': 'Organization',
        name: 'Rotary International District 3170'
      }
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://quizmania.atreyakamat.dev/#app',
      name: 'QuizMania',
      url: 'https://quizmania.atreyakamat.dev',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All modern web browsers',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR'
      },
      creator: {
        '@type': 'Organization',
        name: 'Rotaract Club of Mapusa',
        url: 'https://quizmania.atreyakamat.dev'
      },
      publisher: {
        '@id': 'https://quizmania.atreyakamat.dev/#organization'
      }
    },
    {
      '@type': 'WebSite',
      '@id': 'https://quizmania.atreyakamat.dev/#website',
      url: 'https://quizmania.atreyakamat.dev',
      name: 'QuizMania',
      publisher: {
        '@id': 'https://quizmania.atreyakamat.dev/#organization'
      }
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://eaqmwvxggnyprletpklr.supabase.co" />
        <link rel="dns-prefetch" href="https://eaqmwvxggnyprletpklr.supabase.co" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
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
