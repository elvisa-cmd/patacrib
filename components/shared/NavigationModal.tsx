'use client'

import dynamic from 'next/dynamic'
import type { NavProperty } from './NavigationMapInner'

export type { NavProperty } from './NavigationMapInner'

const NavigationMap = dynamic(
  () => import('./NavigationMap'),
  {
    ssr:     false,
    loading: () => (
      <div style={{ padding: '32px', textAlign: 'center' as const }}>
        <div style={{
          width: '24px', height: '24px',
          border: '3px solid #1a6b4a', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          margin: '0 auto 8px',
        }} />
        <div style={{ fontSize: '13px', color: '#6b6055' }}>Loading map…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    ),
  },
)

export interface NavigationModalProps {
  isOpen:   boolean
  onClose:  () => void
  property: NavProperty | null
}

export default function NavigationModal({ isOpen, onClose, property }: NavigationModalProps) {
  if (!isOpen || !property) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-[#faf8f5]"
      role="dialog"
      aria-modal="true"
      aria-label="Get directions"
    >
      {/* Sticky header */}
      <div style={{
        background:   '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding:      '14px 16px',
        flexShrink:   0,
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
      }}>
        <button
          onClick={onClose}
          style={{
            width: '36px', height: '36px',
            background: 'rgba(0,0,0,0.06)', border: 'none',
            borderRadius: '50%', fontSize: '18px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-label="Close"
        >←</button>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f0e0c' }}>Directions</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        <div style={{ padding: '12px 16px 32px' }}>
          <NavigationMap property={property} onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
