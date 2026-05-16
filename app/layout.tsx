import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers }         from './providers'
import { PageLoader }        from '@/components/shared/PageLoader'
import InstallPrompt         from '@/components/shared/InstallPrompt'
import FloatingBottomNav     from '@/components/ui/FloatingBottomNav'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor:     '#1a6b4a',
  width:          'device-width',
  initialScale:   1,
  maximumScale:   1,
  userScalable:   false,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://patacrib.vercel.app'),
  title: {
    default:  'PataKrib — GPS-Verified Rentals in Kenya',
    template: '%s | PataKrib',
  },
  description: 'Browse GPS-pinned rental properties across Nairobi, Mombasa, Kisumu and all of Kenya. Virtual tours, matatu routes, water schedules and precise directions to every listing.',
  keywords: [
    'Kenya rentals', 'Nairobi apartments', 'houses to rent Kenya',
    'GPS verified rentals', 'Nairobi rental listings', 'Mombasa rentals',
    'bedsitter Nairobi', 'apartment Westlands', 'house Karen',
    'rental Kenya', 'PataKrib', 'property Kenya',
  ],
  authors:   [{ name: 'PataKrib' }],
  creator:   'PataKrib',
  publisher: 'PataKrib',
  manifest:  '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'PataKrib',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'en_KE',
    url:         'https://patacrib.vercel.app',
    siteName:    'PataKrib',
    title:       'PataKrib — GPS-Verified Rentals in Kenya',
    description: 'Find your exact home in Kenya. GPS-pinned listings with virtual tours, matatu routes and precise directions.',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'PataKrib — Find GPS-Verified Rentals in Kenya',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'PataKrib — GPS-Verified Rentals in Kenya',
    description: 'Find your exact home in Kenya. GPS-pinned listings with virtual tours and precise directions.',
    images:      ['/og-image.png'],
    creator:     '@patacrib',
  },
  alternates: {
    canonical: 'https://patacrib.vercel.app',
  },
  other: {
    'mobile-web-app-capable':                'yes',
    'apple-mobile-web-app-capable':          'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor':               '#1a6b4a',
    'msapplication-tap-highlight':           'no',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={instrumentSerif.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type':    'Organization',
              name:       'PataKrib',
              url:        'https://patacrib.vercel.app',
              logo:       'https://patacrib.vercel.app/icons/icon-512x512.png',
              description:'GPS-verified rental property platform serving all of Kenya',
              areaServed: { '@type': 'Country', name: 'Kenya' },
              sameAs:     [],
            }),
          }}
        />
        <PageLoader />
        <Providers>
          <div style={{ paddingBottom: '80px' }} className="md:pb-0">
            {children}
          </div>
        </Providers>
        <div className="md:hidden">
          <FloatingBottomNav />
        </div>
        <InstallPrompt />
      </body>
    </html>
  )
}
