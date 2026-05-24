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
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    document.referrer.includes('android-app://')
  )
}

export default function IOSInstallGate({ children }: { children: ReactNode }) {
  const [showGate, setShowGate] = useState(false)
  const [step,     setStep]     = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('bypass') === 'true') return
    if (isIOS() && !isInStandaloneMode()) {
      setShowGate(true)
      // Auto-advance steps so the user just reads and follows
      setTimeout(() => setStep(1), 1000)
      setTimeout(() => setStep(2), 3000)
      setTimeout(() => setStep(3), 5000)
    }
  }, [])

  // Poll every 2 s — gate disappears the moment they open from home screen
  useEffect(() => {
    if (!showGate) return
    const interval = setInterval(() => {
      if (isInStandaloneMode()) {
        setShowGate(false)
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [showGate])

  if (!showGate) return <>{children}</>

  const steps = [
    {
      icon: '⬆️',
      title: 'Tap the Share button',
      desc:  'The Share button is at the bottom centre of your Safari browser — it looks like a box with an arrow pointing up',
    },
    {
      icon: '➕',
      title: 'Tap Add to Home Screen',
      desc:  'Scroll down in the share menu until you see Add to Home Screen then tap it',
    },
    {
      icon: '✅',
      title: 'Tap Add',
      desc:  'Tap Add in the top right corner — then find the PataKrib icon on your home screen and open it',
    },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0d0d0d',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', boxSizing: 'border-box',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: -0.5 }}>
        Pata<span style={{ color: '#4dbe87' }}>Krib</span>
      </p>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 28px' }}>
        Kenya&apos;s GPS-verified rental platform
      </p>

      {/* Card */}
      <div style={{ background: '#1a1a1a', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 44 }}>📲</span>
          <h2 style={{ color: '#fff', fontSize: 19, fontWeight: 700, margin: '10px 0 8px', lineHeight: 1.3 }}>
            Install PataKrib to list a property
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            iPhone requires the app to be installed on your home screen for GPS to work.
            Follow these 3 steps — takes 30 seconds.
          </p>
        </div>

        {/* Steps — auto-highlight, no tapping required */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {steps.map((s, i) => {
            const num    = i + 1
            const active = step === num
            const done   = step > num
            return (
              <div
                key={num}
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  background: active ? '#1a6b4a22' : done ? '#ffffff05' : '#ffffff08',
                  border:     active ? '2px solid #4dbe87' : done ? '2px solid #1a6b4a44' : '2px solid #ffffff10',
                  borderRadius: 14, padding: '14px 16px',
                  transition: 'all 0.3s ease',
                  opacity: step === 0 ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: active ? '#1a6b4a' : done ? '#0d3d2a' : '#2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: done ? 16 : 20,
                  border: active ? '2px solid #4dbe87' : '2px solid transparent',
                  transition: 'all 0.3s ease',
                }}>
                  {done ? '✓' : s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontWeight: 700,
                    color: active ? '#4dbe87' : done ? '#6b7280' : '#fff',
                    margin: '0 0 4px', fontSize: 14,
                    transition: 'color 0.3s',
                  }}>
                    Step {num} — {s.title}
                  </p>
                  <p style={{
                    fontSize: 12,
                    color: active ? '#d1fae5' : '#6b7280',
                    margin: 0, lineHeight: 1.6,
                    transition: 'color 0.3s',
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Share button visual */}
        <div style={{ background: '#ffffff08', borderRadius: 14, padding: 14, marginBottom: 20, textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 10px' }}>
            The Share button at the bottom of Safari:
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2a2a2a', borderRadius: 10, padding: '10px 20px',
            border: '1.5px solid #333',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#4dbe87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Share</span>
          </div>
        </div>

        {/* Status */}
        {step >= 3 ? (
          <div style={{
            background: '#1a6b4a22', border: '2px solid #4dbe87',
            borderRadius: 14, padding: 16, textAlign: 'center', marginBottom: 16,
          }}>
            <p style={{ fontSize: 24, margin: '0 0 6px' }}>🏠</p>
            <p style={{ fontWeight: 700, color: '#4dbe87', margin: '0 0 4px', fontSize: 15 }}>
              Now open PataKrib from your home screen
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
              Find the PataKrib icon you just added and tap it.
              The app will open with full GPS access — no more steps needed.
            </p>
          </div>
        ) : (
          <div style={{ background: '#ffffff08', borderRadius: 14, padding: 12, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
              Follow the steps above in Safari — this page will update automatically once installed
            </p>
          </div>
        )}

        {/* Button — onTouchEnd for iOS reliability, onClick as fallback */}
        <button
          onTouchEnd={(e) => {
            e.preventDefault()
            if (isInStandaloneMode()) {
              setShowGate(false)
            } else {
              setStep(1)
              setTimeout(() => setStep(2), 2000)
              setTimeout(() => setStep(3), 4000)
            }
          }}
          onClick={() => {
            if (isInStandaloneMode()) setShowGate(false)
          }}
          style={{
            width: '100%', padding: '16px',
            background: step >= 3 ? '#1a6b4a' : '#2a2a2a',
            color:      step >= 3 ? '#fff'    : '#6b7280',
            border:     step >= 3 ? 'none'    : '1.5px solid #333',
            borderRadius: 14, fontWeight: 700, fontSize: 15,
            cursor: 'pointer', transition: 'all 0.3s',
            WebkitTapHighlightColor: 'transparent',
            fontFamily: 'inherit',
          }}
        >
          {step >= 3 ? '✓ I have opened it from home screen' : 'Already installed? Tap here'}
        </button>

        <p style={{ fontSize: 11, color: '#374151', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.5 }}>
          One time only · GPS works automatically after install
        </p>
      </div>
    </div>
  )
}
