import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#faf8f5',
        surface: '#ffffff',
        surface2: '#f3f1ec',
        ink: '#0f0e0c',
        muted: '#87837c',
        muted2: '#b5b1aa',
        accent: '#1a6b4a',
        'accent-l': '#e6f2ec',
        'accent-d': '#145c3d',
        gold: '#e8a020',
        blue: '#2563eb',
        green: '#52b788',
        red: '#dc2626',
        border: 'rgba(15,14,12,0.08)',
        border2: 'rgba(15,14,12,0.13)',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['Cabinet Grotesk', 'sans-serif'],
      },
      aspectRatio: {
        '16/6':  '16 / 6',
        '16/10': '16 / 10',
      },
      animation: {
        slideUp: 'slideUp 0.4s cubic-bezier(0.32,0.72,0,1)',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
