import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your IndianPrograms publisher account to submit and manage Indian cultural events across America.',
  keywords: ['create account', 'register', 'IndianPrograms signup', 'event publisher registration'],
  openGraph: {
    title: 'Create Account',
    description: 'Create your IndianPrograms publisher account to submit and manage Indian cultural events across America.',
    url: 'https://indianprograms.com/register',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Account',
    description: 'Create your IndianPrograms publisher account to submit and manage Indian cultural events across America.',
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
