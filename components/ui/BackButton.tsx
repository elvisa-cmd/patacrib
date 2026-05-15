'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      style={{
        width:           '36px',
        height:          '36px',
        background:      'rgba(255,255,255,0.92)',
        border:          '1px solid rgba(0,0,0,0.08)',
        borderRadius:    '12px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        cursor:          'pointer',
        flexShrink:      0,
        padding:         0,
      }}
      aria-label="Go back"
    >
      <svg width="16" height="16" fill="none" stroke="#0f0e0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    </button>
  )
}
