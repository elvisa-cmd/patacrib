'use client'
import { useRef, useState } from 'react'

type Status = 'idle' | 'capturing' | 'processing' | 'done' | 'failed' | 'denied'

interface Props {
  onLocationFound: (lat: number, lng: number) => void
  onFail: () => void
}

export default function PhotoLocationCapture({ onLocationFound, onFail }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [accuracy, setAccuracy] = useState<number | null>(null)

  async function handlePhoto(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]

    setStatus('processing')

    try {
      const exifr = (await import('exifr')).default
      const gps = await exifr.gps(file)

      if (gps && gps.latitude && gps.longitude) {
        const { latitude: lat, longitude: lng } = gps

        // Validate coordinates are real
        if (lat === 0 && lng === 0) {
          throw new Error('Invalid GPS')
        }

        // Get accuracy if available
        const full = await exifr.parse(file, ['GPSHPositioningError', 'GPSDOP'])
        if (full?.GPSHPositioningError) {
          setAccuracy(Math.round(parseFloat(full.GPSHPositioningError)))
        }

        // IMMEDIATELY discard the photo from memory
        // Revoke any object URLs, clear file reference
        URL.revokeObjectURL(URL.createObjectURL(file))

        // Clear the input so no photo is retained
        if (inputRef.current) {
          inputRef.current.value = ''
        }

        setStatus('done')
        onLocationFound(lat, lng)
      } else {
        throw new Error('No GPS in photo')
      }
    } catch (err) {
      console.error('EXIF GPS failed:', err)
      setStatus('failed')

      // Clear input
      if (inputRef.current) {
        inputRef.current.value = ''
      }

      onFail()
    }
  }

  function triggerCamera() {
    setStatus('capturing')
    inputRef.current?.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Hidden camera input - capture only, no gallery */}
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
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#1a6b4a',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: '#fff', fontSize: '16px',
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a6b4a', marginBottom: '1px' }}>
              Location found
              {accuracy && (
                <span style={{ fontWeight: 400, color: '#6b6055', marginLeft: '6px', fontSize: '11px' }}>
                  ±{accuracy}m accuracy
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#6b6055' }}>
              Photo discarded · location only kept
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setStatus('idle'); setAccuracy(null) }}
            style={{
              background: 'none', border: 'none',
              color: '#1a6b4a', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            Retake
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
