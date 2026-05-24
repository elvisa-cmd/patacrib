'use client'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

export default function IOSInstallGate({ children }: { children: ReactNode }) {
  const [showGate, setShowGate] = useState(false)
  const [step,     setStep]     = useState(1)

  useEffect(() => {
    if (isIOS() && !isInStandaloneMode()) {
      setShowGate(true)
    }
  }, [])

  if (!showGate) return <>{children}</>

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0d0d0d',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
          Pata<span style={{ color: '#4dbe87' }}>Krib</span>
        </p>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
          Kenya&apos;s GPS-verified rental platform
        </p>
      </div>

      {/* Main card */}
      <div style={{ background: '#1a1a1a', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 48 }}>📱</span>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '12px 0 8px', lineHeight: 1.3 }}>
            Install PataKrib first
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            To list a property on iPhone, install PataKrib to your home screen first.
            This gives the app full GPS access so your location is captured automatically.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {([
            { n: 1, icon: '⬆️', title: 'Tap the Share button',      desc: 'The share icon at the bottom of your Safari browser' },
            { n: 2, icon: '➕', title: 'Tap Add to Home Screen',     desc: 'Scroll down in the share menu until you see this option' },
            { n: 3, icon: '✅', title: 'Tap Add',                    desc: 'Then open PataKrib from your home screen to continue' },
          ] as const).map(s => (
            <div
              key={s.n}
              onClick={() => setStep(s.n)}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: step === s.n ? '#1a6b4a22' : '#ffffff08',
                border: step === s.n ? '1.5px solid #1a6b4a' : '1.5px solid #ffffff10',
                borderRadius: 14, padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step === s.n ? '#1a6b4a' : '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 18,
              }}>
                {step > s.n ? '✓' : s.icon}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 3px', fontSize: 14 }}>
                  {s.title}
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual hint */}
        <div style={{
          background: '#ffffff08', borderRadius: 14,
          padding: 14, marginBottom: 20, textAlign: 'center',
        }}>
          <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 8px' }}>
            The share button looks like this — at the bottom of Safari:
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#333', borderRadius: 10, padding: '8px 16px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#4dbe87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Share</span>
          </div>
        </div>

        {/* Already installed button */}
        <button
          onClick={() => {
            if (isInStandaloneMode()) {
              setShowGate(false)
            } else {
              alert('Please close Safari and open PataKrib from your home screen icon to continue.')
            }
          }}
          style={{
            width: '100%', padding: '15px',
            background: '#1a6b4a', color: '#fff',
            border: 'none', borderRadius: 14,
            fontWeight: 700, fontSize: 15,
            cursor: 'pointer', marginBottom: 12,
            fontFamily: 'inherit',
          }}
        >
          I have installed it — open from home screen
        </button>

        <p style={{ fontSize: 11, color: '#4b5563', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          This is required once only. After installing, GPS works automatically on every listing.
        </p>
      </div>
    </div>
  )
}
