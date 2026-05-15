'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic                          from 'next/dynamic'
import type { NavRoute }                from './NavigationMapInner'

const NavigationMap = dynamic(
  () => import('./NavigationMap'),
  {
    ssr:     false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-surface2">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-[12px] text-muted">Loading map…</p>
        </div>
      </div>
    ),
  },
)

export interface NavProperty {
  id?:          string
  title:        string
  address:      string
  latitude:     number
  longitude:    number
  price?:       number
  estate:       string | null
  matatuRoutes: string[]
}

export interface NavigationModalProps {
  isOpen:   boolean
  onClose:  () => void
  property: NavProperty | null
}

type TravelMode = 'walking' | 'matatu' | 'driving'

interface NominatimResult {
  lat:          string
  lon:          string
  display_name: string
  namedetails?: { name?: string }
  address?:     { road?: string; suburb?: string; neighbourhood?: string; city?: string }
}

function arrivalTime(minsFromNow: number): string {
  const d = new Date(Date.now() + minsFromNow * 60_000)
  return d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function NavigationModal({ isOpen, onClose, property }: NavigationModalProps) {
  const [route,           setRoute]           = useState<NavRoute | null>(null)
  const [travelMode,      setTravelMode]      = useState<TravelMode>('walking')
  const [fromQuery,       setFromQuery]       = useState('')
  const [fromSuggestions, setFromSuggestions] = useState<NominatimResult[]>([])
  const [fromLocation,    setFromLocation]    = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [searching,       setSearching]       = useState(false)
  const [accuracyMetres,  setAccuracyMetres]  = useState<number | null>(null)
  const [gpsStatus,       setGpsStatus]       = useState<'denied' | 'unavailable' | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Reset state when property changes
  useEffect(() => {
    setRoute(null)
    setFromQuery('')
    setFromSuggestions([])
    setFromLocation(null)
    setSearching(false)
    setAccuracyMetres(null)
    setGpsStatus(null)
  }, [property?.title])

  async function searchLocation(query: string) {
    if (query.length < 3) { setFromSuggestions([]); return }
    setSearching(true)
    try {
      const base = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
        format:           'json',
        limit:            '8',
        countrycodes:     'ke',
        addressdetails:   '1',
        namedetails:      '1',
        dedupe:           '1',
        'accept-language':'en',
      })
      const res  = await fetch(`${base}&q=${encodeURIComponent(query)}`)
      const data = await res.json() as NominatimResult[]

      if (data.length === 0) {
        // Retry with Nairobi context for specific buildings
        const res2  = await fetch(`${base}&q=${encodeURIComponent(query + ' Nairobi')}`)
        const data2 = await res2.json() as NominatimResult[]
        setFromSuggestions(data2)
      } else {
        setFromSuggestions(data)
      }
    } catch {
      setFromSuggestions([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void searchLocation(fromQuery), 400)
    return () => clearTimeout(debounceRef.current)
  }, [fromQuery])

  const currentMins =
    !route         ? null :
    travelMode === 'walking' ? route.walkMinutes   :
    travelMode === 'matatu'  ? route.matatuMinutes :
    route.driveMinutes

  const transportOptions: Array<{ mode: TravelMode; icon: string; label: string; mins: number | null }> = [
    { mode: 'walking', icon: '🚶', label: 'Walk',   mins: route?.walkMinutes   ?? null },
    { mode: 'matatu',  icon: '🚌', label: 'Matatu', mins: route?.matatuMinutes ?? null },
    { mode: 'driving', icon: '🚗', label: 'Drive',  mins: route?.driveMinutes  ?? null },
  ]

  if (!isOpen || !property) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-[#faf8f5]"
      role="dialog"
      aria-modal="true"
      aria-label="Get directions"
    >
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{
        background:   '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding:      '14px 16px 0',
        flexShrink:   0,
      }}>
        {/* Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px',
              background: 'rgba(0,0,0,0.06)', border: 'none',
              borderRadius: '50%', fontSize: '18px',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Close"
          >←</button>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f0e0c' }}>Directions</span>
        </div>

        {/* FROM input */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#b0a898', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
            Your location
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#f5f5f5', borderRadius: '12px', padding: '12px 14px',
              border: fromLocation ? '2px solid #1a6b4a' : '2px solid transparent',
              transition: 'border-color 0.15s',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1a6b4a', flexShrink: 0 }} />
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value)
                  setFromLocation(null)
                  setRoute(null)
                }}
                placeholder="Where are you? e.g. Westlands, Kilimani…"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: '14px', color: '#0f0e0c', outline: 'none',
                  fontFamily: 'inherit',
                }}
                autoComplete="off"
              />
              {searching && (
                <div style={{
                  width: '14px', height: '14px',
                  border: '2px solid #1a6b4a', borderTopColor: 'transparent',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0,
                }} />
              )}
              {fromLocation && (
                <span style={{ color: '#1a6b4a', fontSize: '16px', flexShrink: 0 }}>✓</span>
              )}
            </div>

            {/* Suggestions dropdown */}
            {fromSuggestions.length > 0 && !fromLocation && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
                background: '#fff', borderRadius: '12px', marginTop: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden',
              }}>
                {fromSuggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setFromLocation({ lat: parseFloat(s.lat), lng: parseFloat(s.lon), label: s.display_name })
                      setFromQuery(s.display_name.split(',').slice(0, 2).join(','))
                      setFromSuggestions([])
                    }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
                      fontSize: '13px', color: '#0f0e0c',
                      borderBottom: i < fromSuggestions.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ flexShrink: 0, marginTop: '1px' }}>📍</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {s.namedetails?.name ?? s.display_name.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '11px', color: '#b0a898', marginTop: '2px' }}>
                        {s.display_name.split(',').slice(1, 4).join(',').trim()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Use current location button */}
          <button
            type="button"
            onClick={() => {
              setFromQuery('Getting location…')
              setGpsStatus(null)
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const { latitude: lat, longitude: lng, accuracy } = pos.coords
                  setAccuracyMetres(Math.round(accuracy))
                  try {
                    const res   = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
                    const data  = await res.json() as { display_name?: string }
                    const label = data.display_name?.split(',').slice(0, 2).join(',') ?? 'Current location'
                    setFromLocation({ lat, lng, label })
                    setFromQuery(label)
                  } catch {
                    setFromLocation({ lat, lng, label: 'Current location' })
                    setFromQuery('Current location')
                  }
                },
                (err) => {
                  setFromQuery('')
                  setGpsStatus(err.code === 1 ? 'denied' : 'unavailable')
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
              )
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none',
              color: '#1a6b4a', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', padding: '6px 0', marginTop: '6px',
            }}
          >
            <span>📡</span> Use my current location
          </button>

          {/* Paste coordinates fallback */}
          <button
            type="button"
            onClick={() => {
              const input = prompt('Paste Google Maps link or coordinates (lat, lng):')
              if (!input) return

              // "lat, lng" or "lat lng"
              const coordMatch = input.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/)
              if (coordMatch) {
                const lat = parseFloat(coordMatch[1])
                const lng = parseFloat(coordMatch[2])
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                  setFromLocation({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
                  setFromQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
                  setFromSuggestions([])
                  return
                }
              }

              // Google Maps URL: ?q=-1.2921,36.8219 or /@-1.2921,36.8219
              const urlMatch = input.match(/[?&@](-?\d+\.?\d*),(-?\d+\.?\d*)/)
              if (urlMatch) {
                const lat = parseFloat(urlMatch[1])
                const lng = parseFloat(urlMatch[2])
                setFromLocation({ lat, lng, label: 'Custom location' })
                setFromQuery('Custom location')
                setFromSuggestions([])
              }
            }}
            style={{
              background: 'none', border: 'none',
              color: '#b0a898', fontSize: '11px',
              cursor: 'pointer', padding: '2px 0',
              textDecoration: 'underline',
              display: 'block',
            }}
          >
            Paste Google Maps link or coordinates
          </button>
        </div>

        {/* TO — fixed destination */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#b0a898', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
            Destination
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: '#f5f5f5', borderRadius: '12px', padding: '12px 14px',
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0f0e0c', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f0e0c' }}>{property.title}</div>
              <div style={{ fontSize: '12px', color: '#6b6055', marginTop: '1px' }}>
                {property.address || property.estate || ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <NavigationMap
          property={property}
          userLocation={fromLocation}
          onRouteReady={setRoute}
          travelMode={travelMode}
        />

        {/* Empty state overlay when no location selected */}
        {!fromLocation && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(250,248,245,0.82)',
            backdropFilter: 'blur(2px)',
          }}>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🗺</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f0e0c', marginBottom: '6px' }}>
                Where are you coming from?
              </div>
              <div style={{ fontSize: '13px', color: '#b0a898', maxWidth: '240px' }}>
                Type your location above to get walking, matatu and driving times
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom panel ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>

        {fromLocation && route ? (
          <>
            {/* Transport mode cards */}
            <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 8px' }}>
              {transportOptions.map(opt => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setTravelMode(opt.mode)}
                  style={{
                    flex: 1, padding: '10px 6px', textAlign: 'center',
                    background:   travelMode === opt.mode ? 'rgba(26,107,74,0.08)' : '#fff',
                    border:       travelMode === opt.mode ? '2px solid #1a6b4a' : '1.5px solid rgba(0,0,0,0.10)',
                    borderRadius: '10px', cursor: 'pointer',
                    transition:   'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ fontSize: '20px', lineHeight: 1 }}>{opt.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c', marginTop: '4px', lineHeight: 1 }}>
                    {opt.mins !== null ? `${opt.mins} min` : '–'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b6055', marginTop: '2px', lineHeight: 1 }}>
                    {opt.mins !== null ? arrivalTime(opt.mins) : opt.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Distance + arrival */}
            <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b6055' }}>
                📍 {route.distanceText} total distance
              </span>
              {currentMins !== null && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#1a6b4a' }}>
                  Arrive by {arrivalTime(currentMins)}
                </span>
              )}
            </div>

            {/* Accuracy badge */}
            {accuracyMetres !== null && (
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '8px 14px',
                margin:         '0 16px',
                background:     accuracyMetres <= 50
                  ? 'rgba(26,107,74,0.08)'
                  : accuracyMetres <= 200
                  ? 'rgba(232,160,32,0.08)'
                  : 'rgba(220,38,38,0.08)',
                border: `1px solid ${
                  accuracyMetres <= 50
                    ? 'rgba(26,107,74,0.2)'
                    : accuracyMetres <= 200
                    ? 'rgba(232,160,32,0.2)'
                    : 'rgba(220,38,38,0.2)'
                }`,
                borderRadius: '10px',
                marginTop:    '0',
              }}>
                <div style={{
                  fontSize:  '12px',
                  fontWeight: 600,
                  color:      accuracyMetres <= 50  ? '#1a6b4a'
                            : accuracyMetres <= 200 ? '#b07a10'
                            :                        '#dc2626',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {accuracyMetres <= 50  && '✅'}
                  {accuracyMetres > 50  && accuracyMetres <= 200 && '⚠️'}
                  {accuracyMetres > 200 && '🔴'}
                  Your location: ±{accuracyMetres}m accuracy
                </div>
                <div style={{ fontSize: '11px', color: '#b0a898' }}>
                  {accuracyMetres <= 50  && 'Good GPS'}
                  {accuracyMetres > 50  && accuracyMetres <= 200 && 'Approximate'}
                  {accuracyMetres > 200 && 'Very rough'}
                </div>
              </div>
            )}

            {/* Matatu route chips */}
            {property.matatuRoutes.length > 0 && (
              <div style={{ padding: '8px 16px', background: '#f5f5f2', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#b0a898', marginBottom: '6px' }}>
                  Matatu routes nearby
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                  {property.matatuRoutes.map((r, i) => (
                    <span key={i} style={{
                      background: '#1a6b4a', color: '#fff',
                      fontSize: '11px', fontWeight: 700,
                      padding: '3px 10px',
                    }}>
                      {r.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Step-by-step directions */}
            {route.steps.length > 0 && (
              <div style={{ maxHeight: '112px', overflowY: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                {route.steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                  }}>
                    <span style={{ fontSize: '18px', flexShrink: 0, color: '#6b6055' }}>{step.arrow}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f0e0c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                        {step.instruction}
                      </p>
                      {step.distance && (
                        <p style={{ fontSize: '9px', color: '#b0a898', margin: 0 }}>{step.distance}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Open in Google Maps + Close */}
            <div style={{ padding: '10px 16px 12px', display: 'flex', flexDirection: 'column' as const, gap: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <a
                href={fromLocation
                  ? `https://www.google.com/maps/dir/${fromLocation.lat},${fromLocation.lng}/${property.latitude},${property.longitude}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '8px',
                  width:          '100%',
                  padding:        '16px',
                  background:     '#1a6b4a',
                  color:          '#fff',
                  borderRadius:   '14px',
                  fontSize:       '15px',
                  fontWeight:     700,
                  textDecoration: 'none',
                  boxSizing:      'border-box' as const,
                }}
              >
                <span style={{ fontSize: '20px' }}>🗺</span>
                Open in Google Maps
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.8)' }}>
                  for turn-by-turn
                </span>
              </a>

              <div style={{
                textAlign:  'center',
                fontSize:   '11px',
                color:      '#b0a898',
                lineHeight: 1.5,
              }}>
                Google Maps uses your phone GPS directly for precise navigation.
                {accuracyMetres !== null && accuracyMetres > 100 && (
                  <span style={{ color: '#e8a020', display: 'block', marginTop: '2px' }}>
                    Your browser location is approximate — Google Maps will be more accurate.
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '11px',
                  background: 'none', border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '12px', fontSize: '12px',
                  fontWeight: 700, color: '#6b6055', cursor: 'pointer',
                  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                }}
              >
                ✕ Close
              </button>
            </div>
          </>
        ) : fromLocation && !route ? (
          // Location selected, route loading
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid #1a6b4a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px', color: '#6b6055' }}>Calculating route…</div>
          </div>
        ) : (
          // No location selected — or GPS failed
          <div style={{ padding: '10px 16px 12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
            {gpsStatus && (
              <div style={{
                padding:       '16px',
                background:    '#f5f5f5',
                borderRadius:  '14px',
                textAlign:     'center',
                display:       'flex',
                flexDirection: 'column' as const,
                gap:           '10px',
              }}>
                <div style={{ fontSize: '13px', color: '#6b6055', lineHeight: 1.5 }}>
                  {gpsStatus === 'denied'
                    ? 'Location access was denied. Open Google Maps for precise directions from your current position.'
                    : 'Could not get your location in the browser. Open Google Maps for precise directions from your current position.'
                  }
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '8px',
                    padding:        '14px',
                    background:     '#1a6b4a',
                    color:          '#fff',
                    borderRadius:   '12px',
                    fontSize:       '14px',
                    fontWeight:     700,
                    textDecoration: 'none',
                  }}
                >
                  🗺 Open Google Maps
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '11px',
                background: 'none', border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '12px', fontSize: '12px',
                fontWeight: 700, color: '#6b6055', cursor: 'pointer',
                textTransform: 'uppercase' as const, letterSpacing: '0.05em',
              }}
            >
              ✕ Close
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
