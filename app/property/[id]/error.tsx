'use client'
import Link from 'next/link'
export default function PropertyError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh', background: '#faf8f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'inherit',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '40px 28px',
        textAlign: 'center', maxWidth: '360px', width: '100%',
        border: '1px solid #f0f0f0',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d0d0d', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Property not available
        </div>
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '24px', lineHeight: 1.6 }}>
          This property could not be loaded. It may have been removed or is temporarily unavailable.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#1a6b4a', color: '#fff', border: 'none',
              padding: '12px 20px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <Link href="/browse" style={{
            background: '#f5f5f5', color: '#0d0d0d',
            padding: '12px 20px', borderRadius: '12px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            Browse
          </Link>
        </div>
      </div>
    </div>
  )
}
