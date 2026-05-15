import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers }     from './providers'
import { PageLoader }    from '@/components/shared/PageLoader'
import InstallPrompt     from '@/components/shared/InstallPrompt'

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
  title:       'PataKrib — Find Your Exact Home in Nairobi',
  description: "Kenya's most precise rental platform. GPS-verified listings with real neighbourhood intelligence — matatu routes, water schedules, and safety scores.",
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'default',
    title:           'PataKrib',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type:        'website',
    siteName:    'PataKrib',
    title:       'PataKrib — Find Your Exact Home in Nairobi',
    description: 'GPS-verified rental listings across Nairobi',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'PataKrib',
    description: 'GPS-verified rental listings across Nairobi',
  },
  other: {
    'mobile-web-app-capable':             'yes',
    'apple-mobile-web-app-capable':       'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor':            '#1a6b4a',
    'msapplication-tap-highlight':        'no',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={instrumentSerif.variable}>
      <body className="bg-bg text-ink font-sans antialiased">
        <PageLoader />
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  )
}
