'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f6f9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px 24px',
        textAlign: 'center', maxWidth: '360px', width: '100%', border: '1px solid #f0f0f0',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d0d0d', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Something went wrong
        </div>
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px', lineHeight: 1.5 }}>
          {error.message || 'An error occurred loading your dashboard.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#1a6b4a', color: '#fff', border: 'none',
              padding: '11px 20px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <Link href="/" style={{
            background: '#f5f5f5', color: '#0d0d0d',
            padding: '11px 20px', borderRadius: '12px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            Go home
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '16px', textAlign: 'left' }}>
            <summary style={{ fontSize: '11px', color: '#aaa', cursor: 'pointer' }}>Error details</summary>
            <pre style={{
              fontSize: '10px', color: '#dc2626', background: '#fef5f5',
              padding: '8px', borderRadius: '8px', marginTop: '8px',
              overflow: 'auto', whiteSpace: 'pre-wrap',
            }}>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
