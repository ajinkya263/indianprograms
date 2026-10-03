import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hashtag Intelligence & Generator for Indian Events',
  description: 'Discover trending hashtags for Indian cultural events. AI-powered hashtag generator with effectiveness scores by metro and category.',
  keywords: ['hashtag generator', 'trending hashtags', 'Indian event hashtags', 'social media hashtags', 'hashtag intelligence', 'event marketing'],
  openGraph: {
    title: 'Hashtag Intelligence & Generator for Indian Events',
    description: 'Discover trending hashtags for Indian cultural events. AI-powered hashtag generator with effectiveness scores by metro and category.',
    url: 'https://indianprograms.com/social/hashtags',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hashtag Intelligence & Generator for Indian Events',
    description: 'Discover trending hashtags for Indian cultural events. AI-powered hashtag generator with effectiveness scores by metro and category.',
  },
}

export default function HashtagsLayout({ children }: { children: React.ReactNode }) {
  return children
}
