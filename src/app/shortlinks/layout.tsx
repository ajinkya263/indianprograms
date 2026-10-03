import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'URL Shortener & Link Manager',
  description: 'Create branded short links, track clicks, and generate QR codes. Free URL shortener with analytics built in.',
  keywords: ['URL shortener', 'link manager', 'short links', 'QR code generator', 'link analytics', 'branded links'],
  openGraph: {
    title: 'URL Shortener & Link Manager',
    description: 'Create branded short links, track clicks, and generate QR codes. Free URL shortener with analytics built in.',
    url: 'https://indianprograms.com/shortlinks',
    siteName: 'IndianPrograms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL Shortener & Link Manager',
    description: 'Create branded short links, track clicks, and generate QR codes. Free URL shortener with analytics built in.',
  },
}

export default function ShortLinksLayout({ children }: { children: React.ReactNode }) {
  return children
}
