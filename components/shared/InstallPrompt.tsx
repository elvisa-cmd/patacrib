'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      // Show again after 3 days
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) return
    }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)

    if (ios) {
      // Show iOS instructions after 4 seconds
      setTimeout(() => setShow(true), 4000)
    } else {
      // Android/Chrome - listen for install prompt
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShow(true), 4000)
      })
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem('pwa-dismissed', Date.now().toString())
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShow(false)
      setIsInstalled(true)
    }
  }

  if (!show || isInstalled) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '16px',
      right: '16px',
      zIndex: 999,
      background: '#0d0d0d',
      borderRadius: '24px',
      padding: '20px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      animation: 'slideUp 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
      fontFamily: 'inherit',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: '#1a6b4a',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>
            🏠
          </div>
          <div>
            <div style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#fff',
              marginBottom: '2px',
              letterSpacing: '-0.3px',
            }}>
              Install PataKrib
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
            }}>
              Add to your home screen
            </div>
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            width: '28px', height: '28px',
            borderRadius: '50%',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* iOS Instructions */}
      {isIOS && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Step indicator */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '4px',
          }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: step >= s
                  ? '#1a6b4a'
                  : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {step === 1 && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: '14px',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  background: '#1a6b4a',
                  color: '#fff',
                  width: '22px', height: '22px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>1</span>
                Tap the Share button
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.5,
                marginBottom: '10px',
              }}>
                At the bottom of your Safari browser tap the
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  margin: '0 4px',
                }}>
                  <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    viewBox="0 0 24 24">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share
                </span>
                icon
              </div>
              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a6b4a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Done, I tapped Share →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: '14px',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  background: '#1a6b4a',
                  color: '#fff',
                  width: '22px', height: '22px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>2</span>
                Tap Add to Home Screen
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.5,
                marginBottom: '10px',
              }}>
                Scroll down in the share menu and tap
                <strong style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {' '}Add to Home Screen
                </strong>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
              }}>
                <span style={{ fontSize: '22px' }}>➕</span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                }}>
                  Add to Home Screen
                </span>
              </div>
              <button
                onClick={() => setStep(3)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a6b4a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Done →
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{
              background: 'rgba(26,107,74,0.15)',
              border: '1px solid rgba(26,107,74,0.3)',
              borderRadius: '14px',
              padding: '14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#4dbe87',
                marginBottom: '4px',
              }}>
                PataKrib is installed!
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.5,
                marginBottom: '12px',
              }}>
                Find the PataKrib icon on your home screen and open it like a normal app.
              </div>
              <button
                onClick={dismiss}
                style={{
                  padding: '10px 24px',
                  background: '#1a6b4a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Got it ✓
              </button>
            </div>
          )}
        </div>
      )}

      {/* Android - one tap install */}
      {!isIOS && deferredPrompt && (
        <button
          onClick={installAndroid}
          style={{
            width: '100%',
            padding: '14px',
            background: '#1a6b4a',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '20px' }}>📲</span>
          Install App — One tap
        </button>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
