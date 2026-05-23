'use client'
import { useState, useEffect } from 'react'

type ErrorKind = 'denied' | 'timeout' | 'unavailable' | 'unsupported' | ''

interface Props {
  onLocation: (lat: number, lng: number, accuracy: number) => void
  currentLat?: number | null
  currentLng?: number | null
}

export default function GPSCapture({ onLocation, currentLat, currentLng }: Props) {
  const [status,    setStatus]    = useState<'idle' | 'requesting' | 'success' | 'error'>('idle')
  const [accuracy,  setAccuracy]  = useState<number | null>(null)
  const [errorKind, setErrorKind] = useState<ErrorKind>('')

  useEffect(() => {
    if (currentLat && currentLng) setStatus('success')
  }, [currentLat, currentLng])

  async function captureLocation() {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorKind('unsupported')
      return
    }

    // Check permission state before calling — once denied, the browser will
    // never show the prompt again and getCurrentPosition silently fails.
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      if (perm.state === 'denied') {
        setStatus('error')
        setErrorKind('denied')
        return
      }
    } catch {
      // navigator.permissions not available on this browser — proceed anyway
    }

    setStatus('requesting')
    setErrorKind('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setAccuracy(Math.round(accuracy))
        setStatus('success')
        onLocation(latitude, longitude, accuracy)
      },
      (err) => {
        setStatus('error')
        if (err.code === err.PERMISSION_DENIED) {
          setErrorKind('denied')
        } else if (err.code === err.TIMEOUT) {
          setErrorKind('timeout')
        } else {
          setErrorKind('unavailable')
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  const isDenied = errorKind === 'denied'

  const headerTitle = () => {
    if (status === 'success')    return 'GPS location captured'
    if (status === 'requesting') return 'Getting your location…'
    if (status === 'error') {
      if (isDenied) return 'Location access blocked'
      return 'Location error'
    }
    return 'Capture GPS location'
  }

  const headerSub = () => {
    if (status === 'success' && currentLat && currentLng) {
      return `📍 Location captured (±${accuracy ?? '?'} metres)`
    }
    if (status === 'requesting') return 'Please wait — getting precise location…'
    if (status === 'error') {
      if (isDenied)                    return 'Permission was blocked — follow the steps below'
      if (errorKind === 'timeout')     return 'GPS timed out. Move near a window and try again.'
      if (errorKind === 'unavailable') return 'Location unavailable. Try again outdoors.'
      if (errorKind === 'unsupported') return 'Your browser does not support GPS.'
    }
    return "Tap to pin this property's exact location"
  }

  return (
    <div style={{
      background: status === 'success' ? 'rgba(26,107,74,0.06)'
                : status === 'error'   ? isDenied ? 'rgba(232,160,32,0.04)' : 'rgba(220,38,38,0.04)'
                : '#f5f5f5',
      border: `1.5px solid ${
          status === 'success' ? 'rgba(26,107,74,0.2)'
        : status === 'error'   ? isDenied ? 'rgba(232,160,32,0.25)' : 'rgba(220,38,38,0.2)'
        : '#eee'
      }`,
      borderRadius: '16px',
      padding: '16px',
    }}>

      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: (status === 'idle' || status === 'error') ? '12px' : '0',
      }}>
        <div style={{
          width: '40px', height: '40px',
          background: status === 'success' ? '#1a6b4a'
                    : status === 'error'   ? isDenied ? '#b45309' : '#dc2626'
                    : '#0d0d0d',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '20px',
        }}>
          {status === 'success' ? '📍' : status === 'error' ? isDenied ? '🔒' : '⚠️' : '🗺'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d0d0d', marginBottom: '2px' }}>
            {headerTitle()}
          </div>
          <div style={{
            fontSize: '11px', lineHeight: 1.4,
            color: status === 'success' ? '#1a6b4a'
                 : status === 'error' && isDenied ? '#b07a10'
                 : '#aaa',
          }}>
            {headerSub()}
          </div>
        </div>

        {status === 'requesting' && (
          <div style={{
            width: '24px', height: '24px',
            border: '2px solid #1a6b4a', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'gpspin 0.8s linear infinite',
            flexShrink: 0,
          }} />
        )}
        {status === 'success' && (
          <div style={{
            width: '24px', height: '24px', background: '#1a6b4a', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '13px', color: '#fff', fontWeight: 700,
          }}>✓</div>
        )}
      </div>

      {/* Idle — main capture button */}
      {status === 'idle' && (
        <button
          type="button"
          onClick={() => void captureLocation()}
          style={{
            width: '100%', padding: '12px', background: '#1a6b4a',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>📍</span>
          Capture my location now
        </button>
      )}

      {/* Error — denied: show settings steps, no Try Again (it won't work) */}
      {status === 'error' && isDenied && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* iPhone instructions */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(232,160,32,0.08)',
            border: '1px solid rgba(232,160,32,0.2)',
            borderRadius: '12px',
            fontSize: '12px', color: '#6b4c00', lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>📱 iPhone / Safari</div>
            <div>1. Open the <strong>Settings</strong> app</div>
            <div>2. Scroll down to <strong>Safari</strong> → tap <strong>Location</strong></div>
            <div>3. Select <strong>Allow</strong></div>
            <div>4. Come back and <strong>refresh the page</strong>, then tap the button again</div>
          </div>

          {/* Android instructions */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid #eee',
            borderRadius: '12px',
            fontSize: '12px', color: '#555', lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>🤖 Android / Chrome</div>
            <div>1. Tap the <strong>lock icon</strong> in the address bar</div>
            <div>2. Tap <strong>Permissions → Location → Allow</strong></div>
            <div>3. Tap <strong>Try Again</strong> below</div>
          </div>

          <button
            type="button"
            onClick={() => void captureLocation()}
            style={{
              width: '100%', padding: '11px', background: '#0d0d0d',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Error — recoverable (timeout / unavailable / unsupported) */}
      {status === 'error' && !isDenied && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => void captureLocation()}
            style={{
              width: '100%', padding: '12px', background: '#0d0d0d',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try Again
          </button>
          {errorKind === 'timeout' && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(232,160,32,0.08)',
              border: '1px solid rgba(232,160,32,0.2)',
              borderRadius: '10px', fontSize: '12px', color: '#b07a10', lineHeight: 1.5,
            }}>
              iPhone GPS can be slow indoors. Move near a window or step outside and try again.
            </div>
          )}
        </div>
      )}

      {/* Success — recapture option */}
      {status === 'success' && (
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => void captureLocation()}
            style={{
              padding: '9px 14px',
              background: 'rgba(26,107,74,0.08)',
              border: '1px solid rgba(26,107,74,0.15)',
              borderRadius: '10px', fontSize: '12px', fontWeight: 600,
              color: '#1a6b4a', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🔄 Recapture location
          </button>
        </div>
      )}

      <style>{`@keyframes gpspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
