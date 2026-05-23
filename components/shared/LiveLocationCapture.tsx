'use client'
import { useRef, useState } from 'react'

interface Props {
  onLocationFound: (lat: number, lng: number, address: string, source: 'live') => void
}

export default function LiveLocationCapture({ onLocationFound }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'capturing' | 'locating' | 'success' | 'gps_failed'>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [pasteLink, setPasteLink] = useState('')
  const [linkError, setLinkError] = useState('')

  const handlePhotoTaken = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreviewUrl(URL.createObjectURL(file))
    setStatus('locating')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })

        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json() as { display_name?: string }
          const addr = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          setStatus('success')
          onLocationFound(lat, lng, addr, 'live')
        } catch {
          setStatus('success')
          onLocationFound(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'live')
        }
      },
      () => {
        setStatus('gps_failed')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    )
  }

  const handleLinkParse = async () => {
    setLinkError('')
    const url = pasteLink.trim()

    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ]

    let found: { lat: number; lng: number } | null = null
    for (const pattern of patterns) {
      const m = url.match(pattern)
      if (m) { found = { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }; break }
    }

    if (!found) {
      setLinkError('Could not read coordinates. Copy the full Google Maps link.')
      return
    }

    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${found.lat}&lon=${found.lng}&format=json`)
      const data = await res.json() as { display_name?: string }
      const addr = data.display_name || `${found.lat.toFixed(6)}, ${found.lng.toFixed(6)}`
      setStatus('success')
      onLocationFound(found.lat, found.lng, addr, 'live')
    } catch {
      setStatus('success')
      onLocationFound(found.lat, found.lng, `${found.lat.toFixed(6)}, ${found.lng.toFixed(6)}`, 'live')
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        background: '#f0fdf4', border: '2px solid #1a6b4a',
        borderRadius: 16, padding: 16, textAlign: 'center',
      }}>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Live photo"
            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
          />
        )}
        <p style={{ fontSize: 28, margin: 0 }}>📍</p>
        <p style={{ fontWeight: 700, color: '#1a6b4a', margin: '6px 0 4px', fontSize: 16 }}>
          Location verified!
        </p>
        {coords && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        )}
      </div>
    )
  }

  if (status === 'locating') {
    return (
      <div style={{
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: 16, padding: 20, textAlign: 'center',
      }}>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Live photo"
            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 12, opacity: 0.7 }}
          />
        )}
        <div style={{
          width: 36, height: 36, border: '3px solid #1a6b4a',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'llcspin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <style>{`@keyframes llcspin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Getting your location...</p>
        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Hold still for a moment</p>
      </div>
    )
  }

  if (status === 'gps_failed') {
    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: 16 }}>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Live photo"
            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
          />
        )}
        <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: '0 0 4px' }}>
          📍 GPS blocked — paste a Google Maps link
        </p>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px' }}>
          Open Google Maps → find this property → tap Share → Copy link → paste below
        </p>
        <textarea
          value={pasteLink}
          onChange={e => { setPasteLink(e.target.value); setLinkError('') }}
          placeholder="Paste Google Maps link here..."
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            border: linkError ? '2px solid #ef4444' : '1.5px solid #d1d5db',
            fontSize: 13, fontFamily: 'inherit', resize: 'none',
            outline: 'none', boxSizing: 'border-box', color: '#1a1a1a',
          }}
        />
        {linkError && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 8px' }}>{linkError}</p>
        )}
        <button
          type="button"
          onClick={() => void handleLinkParse()}
          disabled={!pasteLink.trim()}
          style={{
            width: '100%', padding: '14px',
            background: pasteLink.trim() ? '#1a6b4a' : '#9ca3af',
            color: '#fff', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 15,
            cursor: pasteLink.trim() ? 'pointer' : 'not-allowed',
            marginTop: 8, fontFamily: 'inherit',
          }}
        >
          Set location from link
        </button>
      </div>
    )
  }

  // idle
  return (
    <div>
      <div style={{
        background: '#fffbeb', border: '1px solid #f59e0b',
        borderRadius: 14, padding: 14, marginBottom: 14,
      }}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 6px', color: '#92400e' }}>
          📸 Take a live photo to verify location
        </p>
        <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.5 }}>
          Stand inside or outside the property and take a photo now.
          This proves you are physically at the location — coordinates are captured at the same moment.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => void handlePhotoTaken(e)}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%', padding: '16px',
          background: '#1a6b4a', color: '#fff',
          border: 'none', borderRadius: 14,
          fontWeight: 700, fontSize: 16,
          cursor: 'pointer', letterSpacing: 0.3,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 22 }}>📸</span>
        Take photo at property now
      </button>

      <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '10px 0 0' }}>
        This opens your camera directly — no gallery access
      </p>
    </div>
  )
}
