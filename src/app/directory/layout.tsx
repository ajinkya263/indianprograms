import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Indian Business Directory — Restaurants, Temples, Grocery & More',
  description: 'Find Indian restaurants, temples, grocery stores, and services across 35+ US cities. Ratings, reviews, and directions.',
  keywords: ['Indian business directory', 'Indian restaurants USA', 'Indian temples', 'Indian grocery stores', 'desi businesses', 'Indian services America'],
  openGraph: {
    title: 'Indian Business Directory — Restaurants, Temples, Grocery & More',
    description: 'Find Indian restaurants, temples, grocery stores, and services across 35+ US cities. Ratings, reviews, and directions.',
    url: 'https://indianprograms.com/directory',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Business Directory — Restaurants, Temples, Grocery & More',
    description: 'Find Indian restaurants, temples, grocery stores, and services across 35+ US cities. Ratings, reviews, and directions.',
  },
}

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
