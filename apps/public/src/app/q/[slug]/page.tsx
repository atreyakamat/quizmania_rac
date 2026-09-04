import React from 'react';
import { notFound } from 'next/navigation';
import { getPublishedQuizBySlug } from '@quizmania/shared';
import { QuizRunner } from '@/components/public-quiz/QuizRunner';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const quiz = await getPublishedQuizBySlug(params.slug);
  if (!quiz) {
    return {
      title: 'Quiz Not Found - QuizMania'
    };
  }
  return {
    title: `${quiz.title} - QuizMania | Rotaract Club of Mapusa`,
    description: quiz.description || 'Test your knowledge on QuizMania'
  };
}

export default async function PublicQuizPage({ params }: { params: { slug: string } }) {
  const quiz = await getPublishedQuizBySlug(params.slug);

  if (!quiz) {
    notFound();
  }

  return <QuizRunner quiz={quiz} />;
}
