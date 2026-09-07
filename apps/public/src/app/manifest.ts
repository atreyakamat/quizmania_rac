import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QuizMania — Rotaract Club of Mapusa',
    short_name: 'QuizMania',
    description: 'Think Fast. Learn More. Compete Together. Official interactive quiz platform by Rotaract Club of Mapusa (RI District 3170).',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F9',
    theme_color: '#A50D52',
    icons: [
      {
        src: '/branding/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/branding/quizmania-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/branding/quizmania-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };
}
