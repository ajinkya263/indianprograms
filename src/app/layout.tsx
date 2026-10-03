import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070510',
};

export const metadata: Metadata = {
  title: {
    default: "IndianPrograms — Indian Events, Community & Culture in America",
    template: "%s | IndianPrograms",
  },
  description: "Discover Indian events, businesses, and free online tools. Festivals, concerts, dance, community directory, and developer utilities — all in one place.",
  keywords: ['Indian events', 'Indian community', 'Indian culture', 'desi events', 'Indian festivals USA', 'Bollywood concerts', 'Indian directory', 'IndianPrograms'],
  metadataBase: new URL('https://indianprograms.com'),
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'IndianPrograms — Indian Events, Community & Culture in America',
    description: 'Discover Indian events, businesses, and free online tools. Festivals, concerts, dance, community directory, and developer utilities — all in one place.',
    url: 'https://indianprograms.com',
    siteName: 'IndianPrograms',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IndianPrograms — Indian Events, Community & Culture in America',
    description: 'Discover Indian events, businesses, and free online tools. Festivals, concerts, dance, community directory, and developer utilities — all in one place.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Read the stored theme before hydration so users never see the
            wrong background flash on load. Runs sync in <head>. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='classic')document.documentElement.setAttribute('data-theme','classic')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-dark font-body antialiased">
        {children}
      </body>
    </html>
  );
}
