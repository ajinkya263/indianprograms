import Link from 'next/link'

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

export default function Footer() {
  return (
    <footer className="bg-[#0F0D1A]">
      <div className="tricolor-line w-full" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center text-center gap-3">
          {/* Branding */}
          <span
            className="text-2xl font-bold tracking-wide"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            <span style={{ color: '#FF9933' }}>Ind</span>
            <span className="brand-mid" style={{ color: '#FFFFFF' }}>ian</span>
            <span className="brand-mid" style={{ color: '#FFFFFF' }}>Pro</span>
            <span style={{ color: '#138808' }}>grams</span>
          </span>

          <p className="text-gray-400 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Your guide to Indian cultural events across America
          </p>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-gray-600 text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            &copy; {new Date().getFullYear()} ZAXIS Ventures LLC. All rights reserved.
          </p>
          <p className="text-gray-700 text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            For informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  )
}
