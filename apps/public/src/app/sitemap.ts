import { MetadataRoute } from 'next';
import { getPublishedQuizzesList } from '@quizmania/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://quizmania.atreyakamat.dev';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/quizzes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    }
  ];

  try {
    const publishedQuizzes = await getPublishedQuizzesList();
    const quizRoutes: MetadataRoute.Sitemap = publishedQuizzes.map(q => ({
      url: `${baseUrl}/q/${q.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    }));
    return [...staticRoutes, ...quizRoutes];
  } catch {
    return staticRoutes;
  }
}
