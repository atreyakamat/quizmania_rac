import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedQuizBySlug } from '@quizmania/shared';
import { QuizRunner } from '@/components/public-quiz/QuizRunner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getPublishedQuizBySlug(params.slug);
  if (!quiz) {
    return {
      title: 'Quiz Not Found',
      robots: { index: false, follow: false }
    };
  }

  const isExpired = quiz.availability?.status === 'expired';
  const ogImage = quiz.cover_image || '/branding/quizmania.png';
  const desc = quiz.description || `Test your knowledge with ${quiz.title} on QuizMania by Rotaract Club of Mapusa (RI District 3170).`;

  return {
    title: quiz.title,
    description: desc,
    robots: isExpired ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: `https://quizmania.atreyakamat.dev/q/${quiz.slug}`
    },
    openGraph: {
      title: `${quiz.title} | QuizMania — Rotaract Club of Mapusa`,
      description: desc,
      url: `https://quizmania.atreyakamat.dev/q/${quiz.slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: quiz.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${quiz.title} | QuizMania`,
      description: desc,
      images: [ogImage]
    }
  };
}

export default async function PublicQuizPage({ params }: { params: { slug: string } }) {
  const quiz = await getPublishedQuizBySlug(params.slug);

  if (!quiz) {
    notFound();
  }

  const quizJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quiz.title,
    description: quiz.description || undefined,
    url: `https://quizmania.atreyakamat.dev/q/${quiz.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Rotaract Club of Mapusa',
      url: 'https://quizmania.atreyakamat.dev'
    },
    about: {
      '@type': 'Thing',
      name: 'Interactive Community Competition'
    },
    hasPart: quiz.questions.map((q, idx) => ({
      '@type': 'Question',
      name: `Question ${idx + 1}`,
      text: q.question_text
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizJsonLd) }}
      />
      <QuizRunner quiz={quiz} />
    </>
  );
}
