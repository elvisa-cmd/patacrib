/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest:        'public',
  register:    true,
  skipWaiting: true,
  disable:     process.env.NODE_ENV === 'development',
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler:    'NetworkFirst',
        options: {
          cacheName:  'supabase-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler:    'CacheFirst',
        options: {
          cacheName:  'static-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/image\?.*/i,
        handler:    'CacheFirst',
        options: {
          cacheName:  'image-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
        handler:    'NetworkFirst',
        options: {
          cacheName:  'nominatim-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
        handler:    'CacheFirst',
        options: {
          cacheName:  'map-tiles-cache',
          expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
})

const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co'         },
      { protocol: 'https', hostname: 'images.unsplash.com'   },
      { protocol: 'https', hostname: 'res.cloudinary.com'    },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = withPWA(nextConfig)
