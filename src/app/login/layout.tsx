import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your IndianPrograms account to manage events, short links, and publisher tools.',
  keywords: ['sign in', 'login', 'IndianPrograms account', 'event publisher login'],
  openGraph: {
    title: 'Sign In',
    description: 'Sign in to your IndianPrograms account to manage events, short links, and publisher tools.',
    url: 'https://indianprograms.com/login',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In',
    description: 'Sign in to your IndianPrograms account to manage events, short links, and publisher tools.',
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
