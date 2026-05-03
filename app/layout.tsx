import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PataKrib — Find Your Home in Kenya',
  description: 'Discover rental properties across Nairobi and Kenya.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={instrumentSerif.variable}>
      <body className="bg-bg text-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
