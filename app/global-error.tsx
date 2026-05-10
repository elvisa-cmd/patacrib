'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#fafaf8' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '24px', textAlign: 'center',
        }}>
          <div>
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 4, color: '#9c9c96', marginBottom: 12 }}>
              Something went wrong
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 400, color: '#0f0e0c', marginBottom: 12 }}>
              This page couldn&apos;t load
            </h1>
            <p style={{ fontSize: 14, color: '#9c9c96', marginBottom: 32 }}>
              There was a problem connecting to the server.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  background: '#1a6b4a', color: 'white', border: 'none',
                  padding: '10px 20px', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  border: '1px solid #e5e4e1', color: '#0f0e0c', textDecoration: 'none',
                  padding: '10px 20px', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
