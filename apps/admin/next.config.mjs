/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@quizmania/types', '@quizmania/quiz-schema', '@quizmania/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
};

export default nextConfig;
