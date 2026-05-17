'use client'
import { useRef, useState } from 'react'

type Status = 'idle' | 'capturing' | 'processing' | 'done' | 'failed'

interface Props {
  onLocationFound: (lat: number, lng: number, address: string) => void
  onFail: () => void
}

export default function PhotoLocationCapture({ onLocationFound, onFail }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [locationName, setLocationName] = useState('')

  async function handlePhoto(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setStatus('processing')

    try {
      const exifr = (await import('exifr')).default
      const gps = await exifr.gps(file)

      if (gps && gps.latitude && gps.longitude) {
        const { latitude: lat, longitude: lng } = gps

        if (lat === 0 && lng === 0) throw new Error('Invalid GPS')

        // Reverse geocode to get location name
        let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          if (data.display_name) {
            const parts = data.display_name.split(',')
            name = parts.slice(0, 2).join(',').trim()
          }
        } catch { /* keep coordinate fallback */ }

        // Discard photo immediately
        if (inputRef.current) inputRef.current.value = ''

        setStatus('done')
        setLocationName(name)
        onLocationFound(lat, lng, name)
      } else {
        throw new Error('No GPS in photo')
      }
    } catch (err) {
      console.error('EXIF GPS failed:', err)
      if (inputRef.current) inputRef.current.value = ''
      setStatus('failed')
      onFail()
    }
  }

  function triggerCamera() {
    setStatus('capturing')
    inputRef.current?.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Hidden camera input — capture only, no gallery */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handlePhoto(e.target.files)}
      />

      {/* IDLE */}
      {status === 'idle' && (
        <button
          type="button"
          onClick={triggerCamera}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(26,107,74,0.08)',
            border: '1.5px solid rgba(26,107,74,0.25)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <div style={{
            width: '40px', height: '40px',
            background: '#1a6b4a',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: '20px',
          }}>
            📷
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', marginBottom: '2px' }}>
              Take a photo to locate me
            </div>
            <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.4 }}>
              Photo is used only for GPS · never saved
            </div>
          </div>
        </button>
      )}

      {/* CAPTURING */}
      {status === 'capturing' && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(26,107,74,0.06)',
          border: '1px solid rgba(26,107,74,0.15)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>📷</span>
          <div style={{ fontSize: '13px', color: '#1a6b4a', fontWeight: 600 }}>
            Take a photo of where you are...
          </div>
        </div>
      )}

      {/* PROCESSING */}
      {status === 'processing' && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(26,107,74,0.06)',
          border: '1px solid rgba(26,107,74,0.15)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '18px', height: '18px', flexShrink: 0,
            border: '2px solid #1a6b4a',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div>
            <div style={{ fontSize: '13px', color: '#1a6b4a', fontWeight: 700, marginBottom: '1px' }}>
              Reading your location...
            </div>
            <div style={{ fontSize: '11px', color: '#6b6055' }}>
              Photo will be discarded immediately
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {status === 'done' && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(26,107,74,0.08)',
          border: '1px solid rgba(26,107,74,0.2)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#1a6b4a', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#fff', fontSize: '16px',
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '11px', fontWeight: 600,
              color: '#1a6b4a', marginBottom: '2px',
              textTransform: 'uppercase' as const, letterSpacing: '0.05em',
            }}>
              Your location
            </div>
            <div style={{
              fontSize: '14px', fontWeight: 700,
              color: '#0f0e0c', marginBottom: '2px',
              lineHeight: 1.3,
            }}>
              {locationName || 'Location found'}
            </div>
            <div style={{ fontSize: '11px', color: '#b0a898' }}>
              📷 Photo discarded · GPS only
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setStatus('idle'); setLocationName('') }}
            style={{
              background: 'none', border: 'none',
              color: '#b0a898', fontSize: '18px',
              cursor: 'pointer', lineHeight: 1,
              padding: '0', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* FAILED */}
      {status === 'failed' && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(232,160,32,0.08)',
          border: '1px solid rgba(232,160,32,0.2)',
          borderRadius: '14px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#b07a10', marginBottom: '4px' }}>
            ⚠️ No GPS found in photo
          </div>
          <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5, marginBottom: '10px' }}>
            Make sure your camera has location access enabled.<br/>
            Settings → Camera → Location → Allow<br/>
            Then step outside or near a window and try again.
          </div>
          <button
            type="button"
            onClick={triggerCamera}
            style={{
              width: '100%', padding: '10px',
              background: '#1a6b4a', color: '#fff',
              border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
