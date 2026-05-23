'use client'
import { useState, useEffect } from 'react'

interface Props {
  onLocation: (lat: number, lng: number, accuracy: number) => void
  currentLat?: number | null
  currentLng?: number | null
}

export default function GPSCapture({ onLocation, currentLat, currentLng }: Props) {
  const [status,   setStatus]   = useState<'idle' | 'requesting' | 'success' | 'error' | 'unsupported'>('idle')
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (currentLat && currentLng) setStatus('success')
  }, [currentLat, currentLng])

  function captureLocation() {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      setError('Your browser does not support GPS location')
      return
    }
    setStatus('requesting')
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setAccuracy(Math.round(accuracy))
        setStatus('success')
        onLocation(latitude, longitude, accuracy)
      },
      (err) => {
        setStatus('error')
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location in your browser settings and try again.')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Location unavailable. Make sure you are outdoors or near a window.')
            break
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.')
            break
          default:
            setError('Could not get location. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div style={{
      background: status === 'success' ? 'rgba(26,107,74,0.06)'
                : status === 'error'   ? 'rgba(220,38,38,0.04)'
                : '#f5f5f5',
      border: `1.5px solid ${
        status === 'success' ? 'rgba(26,107,74,0.2)'
        : status === 'error' ? 'rgba(220,38,38,0.2)'
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
                    : status === 'error'   ? '#dc2626'
                    : '#0d0d0d',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '20px',
        }}>
          {status === 'success' ? '📍' : status === 'error' ? '⚠️' : '🗺'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d0d0d', marginBottom: '2px' }}>
            {status === 'success'   ? 'GPS location captured'
           : status === 'requesting' ? 'Getting your location…'
           : status === 'error'     ? 'Location error'
           : 'Capture GPS location'}
          </div>
          <div style={{ fontSize: '11px', color: status === 'success' ? '#1a6b4a' : '#aaa', lineHeight: 1.4 }}>
            {status === 'success' && currentLat && currentLng
              ? `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}${accuracy ? ` · ±${accuracy}m accuracy` : ''}`
              : status === 'requesting'
              ? 'Please wait — getting precise location…'
              : status === 'error'
              ? error
              : "Tap to pin this property's exact location on the map"
            }
          </div>
        </div>

        {status === 'requesting' && (
          <div style={{
            width: '24px', height: '24px',
            border: '2px solid #1a6b4a', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
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

      {status === 'idle' && (
        <button
          type="button"
          onClick={captureLocation}
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

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={captureLocation}
            style={{
              width: '100%', padding: '12px', background: '#0d0d0d',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
          <div style={{
            padding: '12px', background: 'rgba(232,160,32,0.08)',
            border: '1px solid rgba(232,160,32,0.2)', borderRadius: '12px',
            fontSize: '12px', color: '#b07a10', lineHeight: 1.6,
          }}>
            <strong>iPhone users:</strong> Go to Settings → Safari → Location → Allow
          </div>
        </div>
      )}

      {status === 'success' && (
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            onClick={captureLocation}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
