import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Submit an Event — Share Indian Cultural Events',
  description: 'Submit Indian cultural events for free. Share festivals, concerts, dance shows, and community gatherings across America.',
  keywords: ['submit Indian event', 'post event', 'Indian cultural event submission', 'community event', 'Indian festival listing'],
  openGraph: {
    title: 'Submit an Event — Share Indian Cultural Events',
    description: 'Submit Indian cultural events for free. Share festivals, concerts, dance shows, and community gatherings across America.',
    url: 'https://indianprograms.com/submit',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit an Event — Share Indian Cultural Events',
    description: 'Submit Indian cultural events for free. Share festivals, concerts, dance shows, and community gatherings across America.',
  },
}

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children
}
