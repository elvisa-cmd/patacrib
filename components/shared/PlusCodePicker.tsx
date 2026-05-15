'use client'
import { useState } from 'react'

interface Props {
  onCapture:         (lat: number, lng: number, address: string, plusCode: string) => void
  onClear:           () => void
  captured:          boolean
  capturedAddress?:  string
  capturedLat?:      number
  capturedLng?:      number
  capturedPlusCode?: string
}

const NAIROBI = { lat: -1.2864, lng: 36.8172 }

export default function PlusCodePicker({
  onCapture,
  onClear,
  captured,
  capturedAddress,
  capturedLat,
  capturedLng,
  capturedPlusCode,
}: Props) {
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

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

  async function handleSubmit() {
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return

    setError('')
    setLoading(true)

    try {
      const { OpenLocationCode } = await import('open-location-code')

      if (!OpenLocationCode.isValid(cleanCode)) {
        setError('Invalid Plus Code. Example: 6G3QGW4G+FH or GW4G+FH')
        setLoading(false)
        return
      }

      let lat: number
      let lng: number
      let fullCode: string

      if (OpenLocationCode.isShort(cleanCode)) {
        fullCode = OpenLocationCode.recoverNearest(cleanCode, NAIROBI.lat, NAIROBI.lng)
        const decoded = OpenLocationCode.decode(fullCode)
        lat = decoded.latitudeCenter
        lng = decoded.longitudeCenter
      } else {
        fullCode = cleanCode
        const decoded = OpenLocationCode.decode(cleanCode)
        lat = decoded.latitudeCenter
        lng = decoded.longitudeCenter
      }

      // Kenya bounds check
      if (lat < -5 || lat > 5 || lng < 33 || lng > 42) {
        setError('This Plus Code is not in Kenya. Please try again.')
        setLoading(false)
        return
      }

      const address = await reverseGeocode(lat, lng)
      setLoading(false)
      onCapture(lat, lng, address, fullCode)
    } catch {
      setError('Could not decode this Plus Code. Please check and try again.')
      setLoading(false)
    }
  }

  // ── DONE STATE ───────────────────────────────────────────────────────────────
  if (captured && capturedPlusCode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{
          padding:      '14px',
          background:   'rgba(26,107,74,0.08)',
          border:       '1px solid rgba(26,107,74,0.25)',
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
              display: 'flex', alignItems: 'center', gap: '6px',
              fontFamily: 'monospace',
            }}>
              📍 {capturedPlusCode}
            </div>
            {capturedLat !== undefined && capturedLng !== undefined && (
              <div style={{ fontSize: '10px', color: '#c0b8b0', fontFamily: 'monospace', marginTop: '2px' }}>
                🔒 {capturedLat.toFixed(6)}, {capturedLng.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setCode(''); setError(''); onClear() }}
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

  // ── ENTRY STATE ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Instructions */}
      <div style={{
        background:   '#f5f5f5',
        borderRadius: '14px',
        padding:      '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', marginBottom: '2px' }}>
          How to find your Plus Code
        </div>

        {([
          { num: '1', icon: '📱', title: 'Open Google Maps',          desc: 'Tap the button below to open Google Maps on your phone' },
          { num: '2', icon: '📍', title: 'Navigate to your property', desc: 'Find the exact location of your property on the map' },
          { num: '3', icon: '👆', title: 'Tap the exact spot',        desc: 'Tap the map to drop a pin on the exact location' },
          { num: '4', icon: '🔑', title: 'Find the Plus Code',        desc: "Scroll the bottom panel — you'll see a short code like GW4G+FH" },
          { num: '5', icon: '📋', title: 'Copy and paste it here',    desc: 'Copy the Plus Code and paste it in the box below' },
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
        onClick={() => window.open('https://maps.google.com/?q=-1.2864,36.8172', '_blank')}
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

      {/* Code input */}
      <div style={{
        background:   '#f5f5f5',
        borderRadius: '12px',
        padding:      '12px 14px',
        display: 'flex', alignItems: 'center', gap: '10px',
        border: error ? '1px solid rgba(220,38,38,0.3)' : '1px solid transparent',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>📍</span>
        <input
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleSubmit() } }}
          placeholder="e.g. GW4G+FH or 6G3QGW4G+FH"
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: '14px', color: '#0f0e0c', outline: 'none',
            fontFamily: 'monospace',
          }}
        />
        {loading && (
          <div style={{
            width: '16px', height: '16px', flexShrink: 0,
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

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!code.trim() || loading}
        style={{
          width: '100%', padding: '14px',
          background: code.trim() && !loading ? '#1a6b4a' : 'rgba(26,107,74,0.3)',
          color: '#fff', border: 'none', borderRadius: '12px',
          fontSize: '14px', fontWeight: 700,
          cursor: code.trim() && !loading ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Locating…' : 'Set location'}
      </button>

      <div style={{ fontSize: '12px', color: '#b0a898', textAlign: 'center', lineHeight: 1.5 }}>
        Plus Codes work anywhere — even in areas with no street address
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
