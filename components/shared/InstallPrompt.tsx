'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [showPrompt,     setShowPrompt]     = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null)
  const [isIOS,          setIsIOS]          = useState(false)
  const [isInstalled,    setIsInstalled]    = useState(false)

  useEffect(() => {
    // Already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)

    // Already dismissed
    if (localStorage.getItem('pwa-prompt-dismissed')) return

    if (ios) {
      setTimeout(() => setShowPrompt(true), 3000)
    } else {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as typeof deferredPrompt)
        setTimeout(() => setShowPrompt(true), 3000)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowPrompt(false)
      setIsInstalled(true)
    }
  }

  if (!showPrompt || isInstalled) return null

  return (
    <div style={{
      position:      'fixed',
      bottom:        '80px',
      left:          '16px',
      right:         '16px',
      zIndex:        1000,
      background:    '#0f0e0c',
      borderRadius:  '20px',
      padding:       '16px',
      boxShadow:     '0 8px 32px rgba(0,0,0,0.3)',
      display:       'flex',
      flexDirection: 'column',
      gap:           '12px',
      animation:     'pkSlideUp 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{
          width:      '48px',
          height:     '48px',
          borderRadius: '12px',
          background: '#1a6b4a',
          display:    'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize:   '24px',
          flexShrink: 0,
        }}>
          🏠
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            Install PataKrib
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            {isIOS
              ? 'Tap the share button below then "Add to Home Screen" to install'
              : 'Add to your home screen for the best experience'
            }
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '20px', cursor: 'pointer',
            padding: '0', lineHeight: 1, flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {isIOS ? (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '10px 14px',
          background:   'rgba(255,255,255,0.1)',
          borderRadius: '10px',
          fontSize:     '13px',
          color:        '#fff',
        }}>
          <span style={{ fontSize: '20px' }}>⬆️</span>
          Tap Share → Add to Home Screen
        </div>
      ) : (
        <button
          onClick={() => void install()}
          style={{
            width:        '100%',
            padding:      '13px',
            background:   '#1a6b4a',
            color:        '#fff',
            border:       'none',
            borderRadius: '12px',
            fontSize:     '14px',
            fontWeight:   700,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          Install App
        </button>
      )}

      <style>{`
        @keyframes pkSlideUp {
          from { transform: translateY(100px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  )
}
