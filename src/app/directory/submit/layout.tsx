import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Your Indian Business — Free Directory Submission',
  description: 'Submit your Indian business to our directory for free. Get discovered by thousands of Indians across America.',
  keywords: ['list Indian business', 'submit business directory', 'Indian business listing', 'free business listing', 'Indian community directory'],
  openGraph: {
    title: 'List Your Indian Business — Free Directory Submission',
    description: 'Submit your Indian business to our directory for free. Get discovered by thousands of Indians across America.',
    url: 'https://indianprograms.com/directory/submit',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'List Your Indian Business — Free Directory Submission',
    description: 'Submit your Indian business to our directory for free. Get discovered by thousands of Indians across America.',
  },
}

export default function DirectorySubmitLayout({ children }: { children: React.ReactNode }) {
  return children
}
