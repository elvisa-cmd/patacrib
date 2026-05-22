import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers }         from './providers'
import { PageLoader }        from '@/components/shared/PageLoader'
import InstallPrompt         from '@/components/shared/InstallPrompt'
import SmartBottomNav        from '@/components/ui/SmartBottomNav'
import { Analytics }         from '@vercel/analytics/react'
import { SpeedInsights }     from '@vercel/speed-insights/next'

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
    icon: [
      { url: '/favicon.svg',      type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#1a6b4a' },
    ],
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
    'msapplication-TileImage':               '/icons/icon-96x96.png',
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
        <link rel="dns-prefetch" href="https://router.project-osrm.org" />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">
        {/* Organization / LocalBusiness schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type':    'LocalBusiness',
              '@id':      'https://patacrib.vercel.app',
              name:       'PataKrib',
              description:'GPS-verified rental property platform serving all of Kenya',
              url:        'https://patacrib.vercel.app',
              logo: {
                '@type': 'ImageObject',
                url:     'https://patacrib.vercel.app/android-chrome-512x512.png',
                width:   512,
                height:  512,
              },
              image:              'https://patacrib.vercel.app/og-image.png',
              priceRange:         'KSh 10,000 - KSh 500,000',
              currenciesAccepted: 'KES',
              paymentAccepted:    'Cash, M-Pesa',
              areaServed: [
                { '@type': 'City',    name: 'Nairobi'  },
                { '@type': 'City',    name: 'Mombasa'  },
                { '@type': 'City',    name: 'Kisumu'   },
                { '@type': 'City',    name: 'Nakuru'   },
                { '@type': 'City',    name: 'Eldoret'  },
                { '@type': 'Country', name: 'Kenya'    },
              ],
              knowsAbout: [
                'Rental Properties',
                'GPS Property Location',
                'Virtual Property Tours',
                'Kenya Real Estate',
                'Nairobi Apartments',
              ],
              sameAs: ['https://patacrib.vercel.app'],
            }),
          }}
        />
        {/* WebSite schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type':    'WebSite',
              name:       'PataKrib',
              url:        'https://patacrib.vercel.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type':      'EntryPoint',
                  urlTemplate:  'https://patacrib.vercel.app/browse?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <PageLoader />
        <Providers>
          <div style={{ paddingBottom: '80px' }} className="md:pb-0">
            {children}
          </div>
          <div className="md:hidden">
            <SmartBottomNav />
          </div>
        </Providers>
        <InstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
