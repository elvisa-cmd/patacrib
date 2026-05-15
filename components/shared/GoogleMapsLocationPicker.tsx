'use client'
import { useState } from 'react'

interface Props {
  onCapture:        (lat: number, lng: number, address: string) => void
  onClear:          () => void
  captured:         boolean
  capturedAddress?: string
  capturedLat?:     number
  capturedLng?:     number
}

export default function GoogleMapsLocationPicker({
  onCapture,
  onClear,
  captured,
  capturedAddress,
  capturedLat,
  capturedLng,
}: Props) {
  const [pastedLink, setPastedLink] = useState('')
  const [error,      setError]      = useState('')
  const [parsing,    setParsing]    = useState(false)
  const [step,       setStep]       = useState<'instructions' | 'paste' | 'done'>(
    captured ? 'done' : 'instructions'
  )

  function extractCoordinates(input: string): { lat: number; lng: number } | null {
    // Pattern 1: google.com/maps?q=lat,lng
    let m = input.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }

    // Pattern 2: @lat,lng in URL
    m = input.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }

    // Pattern 4: /place/lat,lng
    m = input.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }

    // Pattern 5: raw coordinates pasted directly "-1.2921, 36.8219"
    m = input.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }

    // Pattern 6: ll=lat,lng
    m = input.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }

    // Pattern 7: /maps/place/name/@lat,lng,zoom
    m = input.match(/\/maps\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }

    return null
  }

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json() as { display_name?: string }
      return data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  async function handlePaste(value: string) {
    setPastedLink(value)
    setError('')
    if (!value.trim()) return

    setParsing(true)

    const fullUrl = value.trim()
    const coords  = extractCoordinates(fullUrl)

    if (!coords) {
      // Try resolving short URL via proxy
      try {
        const res = await fetch(`/api/resolve-url?url=${encodeURIComponent(fullUrl)}`)
        if (res.ok) {
          const data     = await res.json() as { resolvedUrl?: string }
          const resolved = extractCoordinates(data.resolvedUrl ?? '')
          if (resolved) {
            const address = await reverseGeocode(resolved.lat, resolved.lng)
            onCapture(resolved.lat, resolved.lng, address)
            setStep('done')
            setParsing(false)
            return
          }
        }
      } catch { /* fall through */ }

      setParsing(false)
      setError(
        'Could not read coordinates from this link. Try the steps below to get a direct link with coordinates.',
      )
      return
    }

    // Validate coordinates are in Kenya roughly
    if (coords.lat < -5 || coords.lat > 5 || coords.lng < 33 || coords.lng > 42) {
      setParsing(false)
      setError('These coordinates do not appear to be in Kenya. Please try again.')
      return
    }

    const address = await reverseGeocode(coords.lat, coords.lng)
    setParsing(false)
    onCapture(coords.lat, coords.lng, address)
    setStep('done')
  }

  function openGoogleMaps() {
    window.open('https://maps.google.com/?q=-1.2864,36.8172', '_blank')
  }

  function reset() {
    setPastedLink('')
    setError('')
    setStep('instructions')
    onClear()
  }

  // ── DONE STATE ───────────────────────────────────────────────────────────────
  if (step === 'done' && captured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          padding:    '14px',
          background: 'rgba(26,107,74,0.08)',
          border:     '1px solid rgba(26,107,74,0.25)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#1a6b4a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '18px',
          }}>
            ✅
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a6b4a', marginBottom: '4px' }}>
              Location set precisely
            </div>
            <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5, marginBottom: '6px' }}>
              {capturedAddress}
            </div>
            <div style={{
              fontSize: '11px', color: '#b0a898',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontFamily: 'monospace',
            }}>
              🔒 {capturedLat?.toFixed(7)}, {capturedLng?.toFixed(7)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          style={{
            padding:      '10px',
            background:   'none',
            border:       '1px solid rgba(0,0,0,0.12)',
            borderRadius: '10px',
            fontSize: '13px', color: '#6b6055',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Change location
        </button>
      </div>
    )
  }

  // ── INSTRUCTIONS STATE ───────────────────────────────────────────────────────
  if (step === 'instructions') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          background:   '#f5f5f5',
          borderRadius: '14px',
          padding:      '16px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', marginBottom: '2px' }}>
            How to set your exact location
          </div>

          {([
            { num: '1', icon: '📱', title: 'Open Google Maps',           desc: 'Tap the button below to open Google Maps on your phone' },
            { num: '2', icon: '📍', title: 'Find the exact property spot', desc: 'Navigate to where your property is located on the map' },
            { num: '3', icon: '👆', title: 'Long press on the location',  desc: 'Hold your finger on the exact spot until a red pin drops' },
            { num: '4', icon: '🔗', title: 'Tap Share → Copy link',       desc: 'Tap the address bar at the bottom, then tap Share and copy the link' },
            { num: '5', icon: '📋', title: 'Paste the link here',         desc: 'Come back and paste the copied link into PataKrib' },
          ] as const).map(s => (
            <div key={s.num} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1a6b4a', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, flexShrink: 0,
              }}>
                {s.num}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f0e0c', marginBottom: '2px' }}>
                  {s.icon} {s.title}
                </div>
                <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={openGoogleMaps}
          style={{
            width: '100%', padding: '14px',
            background: '#4285f4', color: '#fff',
            border: 'none', borderRadius: '12px',
            fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          🗺 Open Google Maps
        </button>

        <button
          type="button"
          onClick={() => setStep('paste')}
          style={{
            width: '100%', padding: '12px',
            background: 'rgba(26,107,74,0.08)',
            border:     '1px solid rgba(26,107,74,0.2)',
            borderRadius: '12px',
            fontSize: '13px', fontWeight: 600, color: '#1a6b4a',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          📋 I already copied the link — paste it
        </button>
      </div>
    )
  }

  // ── PASTE STATE ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f0e0c' }}>
        Paste your Google Maps link
      </div>

      <div style={{
        background:   '#f5f5f5',
        borderRadius: '12px',
        padding:      '12px 14px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        border: error ? '1px solid rgba(220,38,38,0.3)' : '1px solid transparent',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>📋</span>
        <textarea
          value={pastedLink}
          onChange={e => void handlePaste(e.target.value)}
          placeholder={'Paste Google Maps link here...\ne.g. https://maps.app.goo.gl/...'}
          rows={3}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: '13px', color: '#0f0e0c', outline: 'none',
            fontFamily: 'inherit', resize: 'none', lineHeight: 1.5,
          }}
        />
        {parsing && (
          <div style={{
            width: '16px', height: '16px', flexShrink: 0, marginTop: '2px',
            border: '2px solid #1a6b4a', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        )}
      </div>

      {error && (
        <div style={{
          padding:      '10px 14px',
          background:   'rgba(220,38,38,0.06)',
          border:       '1px solid rgba(220,38,38,0.2)',
          borderRadius: '10px',
          fontSize: '12px', color: '#dc2626', lineHeight: 1.5,
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#b0a898', textAlign: 'center', lineHeight: 1.5 }}>
        You can also paste raw coordinates like:<br />
        <span style={{ fontFamily: 'monospace', color: '#6b6055' }}>-1.292100, 36.821900</span>
      </div>

      <button
        type="button"
        onClick={() => setStep('instructions')}
        style={{
          padding:      '10px',
          background:   'none',
          border:       '1px solid rgba(0,0,0,0.1)',
          borderRadius: '10px',
          fontSize: '13px', color: '#6b6055',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        ← Back to instructions
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
