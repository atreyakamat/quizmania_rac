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
        src: '/branding/quizmania.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };
}
