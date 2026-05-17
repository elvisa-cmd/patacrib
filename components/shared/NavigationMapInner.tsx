'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface NavProperty {
  id?:          string
  title:        string
  address?:     string | null
  latitude:     number
  longitude:    number
  price?:       number
  estate?:      string | null
  city?:        string | null
  matatuRoutes?: string[]
}

interface RouteStep {
  instruction: string
  distance:    string
  duration:    number
  type:        string
  modifier:    string
}

type TransportMode = 'walk' | 'matatu' | 'drive'
type Status = 'idle' | 'locating' | 'routing' | 'ready' | 'denied'

interface Props {
  property: NavProperty
  onClose:  () => void
}

function getStepIcon(type: string, modifier: string): string {
  if (type === 'depart') return '🚦'
  if (type === 'arrive') return '📍'
  if (type === 'roundabout') return '🔄'
  if (modifier === 'left' || modifier === 'sharp left') return '⬅️'
  if (modifier === 'right' || modifier === 'sharp right') return '➡️'
  if (modifier === 'slight left') return '↖️'
  if (modifier === 'slight right') return '↗️'
  if (modifier === 'uturn') return '↩️'
  return '⬆️'
}

function formatInstruction(type: string, modifier: string, name: string): string {
  const street = name && name !== '' ? ` onto ${name}` : ''
  switch (type) {
    case 'depart':     return `Head ${modifier || 'forward'}${street}`
    case 'arrive':     return 'Arrive at destination'
    case 'turn':
      if (modifier === 'left')         return `Turn left${street}`
      if (modifier === 'right')        return `Turn right${street}`
      if (modifier === 'slight left')  return `Bear left${street}`
      if (modifier === 'slight right') return `Bear right${street}`
      if (modifier === 'sharp left')   return `Sharp left${street}`
      if (modifier === 'sharp right')  return `Sharp right${street}`
      return `Turn${street}`
    case 'roundabout': return `Enter roundabout${street}`
    case 'continue':   return `Continue${street}`
    case 'merge':      return `Merge${street}`
    case 'fork':       return modifier?.includes('left') ? `Keep left${street}` : `Keep right${street}`
    default:           return `Continue${street}`
  }
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function getMapsUrl(
  userLat: number,
  userLng: number,
  destLat: number,
  destLng: number,
  mode: TransportMode,
): string {
  const dest       = `${destLat},${destLng}`
  const origin     = `${userLat},${userLng}`
  const travelMode = mode === 'walk' ? 'walking' : 'driving'
  if (isIOS()) {
    const dirflg = mode === 'walk' ? 'w' : 'd'
    return `maps://maps.apple.com/?saddr=${origin}&daddr=${dest}&dirflg=${dirflg}`
  }
  return `https://www.google.com/maps/dir/${origin}/${dest}/?travelmode=${travelMode}`
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } },
    )
    const data = await res.json() as { display_name?: string }
    const parts = (data.display_name ?? '').split(',')
    return parts.slice(0, 2).join(',').trim()
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export default function NavigationMapInner({ property, onClose }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const routeLayerRef  = useRef<import('leaflet').Layer | null>(null)
  const userMarkerRef  = useRef<import('leaflet').Marker | null>(null)

  const [status,       setStatus]       = useState<Status>('idle')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userAddress,  setUserAddress]  = useState('')
  const [selectedMode, setSelectedMode] = useState<TransportMode>('drive')
  const [routeSteps,   setRouteSteps]   = useState<RouteStep[]>([])
  const [routeDistance, setRouteDistance] = useState<string | null>(null)
  const [activeStep,   setActiveStep]   = useState(0)
  const [durations,    setDurations]    = useState<Record<TransportMode, number | null>>({
    walk: null, matatu: null, drive: null,
  })

  // ── Route calculation ────────────────────────────────────────────────────────
  const calculateRoute = useCallback(async (
    userLat: number,
    userLng: number,
    mode: TransportMode,
  ) => {
    const profile = mode === 'walk' ? 'foot' : 'driving'
    const { latitude: destLat, longitude: destLng } = property

    try {
      setStatus('routing')
      const url = `https://router.project-osrm.org/route/v1/${profile}/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      const res  = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      const data = await res.json() as {
        routes?: Array<{
          duration: number
          distance: number
          geometry: { coordinates: [number, number][] }
          legs: Array<{ steps: Array<{
            maneuver: { instruction?: string; type: string; modifier?: string }
            name: string
            distance: number
            duration: number
          }> }>
        }>
      }

      if (!data.routes?.[0]) { setStatus('ready'); return }

      const route = data.routes[0]
      const steps = route.legs[0].steps

      const driveMins = Math.ceil(route.duration / 60)

      if (mode === 'drive') {
        setDurations({
          drive:  driveMins,
          matatu: Math.ceil(driveMins * 1.4),
          walk:   Math.ceil(driveMins * 5),
        })
      } else {
        setDurations(prev => ({ ...prev, [mode]: driveMins }))
      }

      setRouteDistance((route.distance / 1000).toFixed(1))

      setRouteSteps(steps.map(step => ({
        instruction: step.maneuver.instruction ||
          formatInstruction(
            step.maneuver.type,
            step.maneuver.modifier ?? '',
            step.name ?? '',
          ),
        distance: step.distance < 1000
          ? `${Math.round(step.distance)}m`
          : `${(step.distance / 1000).toFixed(1)}km`,
        duration: Math.ceil(step.duration / 60),
        type:     step.maneuver.type,
        modifier: step.maneuver.modifier ?? '',
      })))

      setActiveStep(0)

      // Draw route line
      if (mapInstanceRef.current) {
        const L = (await import('leaflet')).default
        routeLayerRef.current?.remove()
        const coords = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        )
        routeLayerRef.current = L.polyline(coords, {
          color:    '#1a6b4a',
          weight:   5,
          opacity:  0.85,
          lineJoin: 'round',
          lineCap:  'round',
        }).addTo(mapInstanceRef.current)
        const bounds = (routeLayerRef.current as import('leaflet').Polyline).getBounds()
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
        }
      }

      setStatus('ready')
    } catch {
      setStatus('ready')
    }
  }, [property.latitude, property.longitude]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Map init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center:             [property.latitude, property.longitude],
        zoom:               14,
        zoomControl:        false,
        attributionControl: false,
        ...({ tap: false } as object),
      } as import('leaflet').MapOptions)

      mapInstanceRef.current = map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '' }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const destIcon = L.divIcon({
        html: `<div style="
          background:#1a6b4a;color:#fff;font-size:11px;font-weight:700;
          padding:5px 10px;border-radius:20px;white-space:nowrap;
          box-shadow:0 3px 10px rgba(0,0,0,0.2);font-family:inherit;
          transform:translateX(-50%) translateY(-100%);
        ">📍 ${property.title.replace(/"/g, '&quot;').slice(0, 32)}</div>`,
        className:  '',
        iconSize:   [0, 0],
        iconAnchor: [0, 0],
      })
      L.marker([property.latitude, property.longitude], { icon: destIcon }).addTo(map)
    }

    initMap()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── User marker ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userLocation || !mapInstanceRef.current) return
    async function addMarker() {
      const L = (await import('leaflet')).default
      userMarkerRef.current?.remove()
      const icon = L.divIcon({
        html: `<div style="
          width:14px;height:14px;background:#4285f4;
          border:3px solid white;border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        className:  '',
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
      })
      if (!userLocation) return
      userMarkerRef.current = L.marker(userLocation, { icon }).addTo(mapInstanceRef.current!)
    }
    addMarker()
  }, [userLocation])

  // ── Recalc when mode changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (userLocation) {
      void calculateRoute(userLocation[0], userLocation[1], selectedMode)
    }
  }, [selectedMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Location handlers ─────────────────────────────────────────────────────────
  async function handlePhotoLocation(lat: number, lng: number) {
    setUserLocation([lat, lng])
    setStatus('locating')
    const address = await reverseGeocode(lat, lng)
    setUserAddress(address)
    await calculateRoute(lat, lng, selectedMode)
  }

  async function handleBrowserGPS() {
    if (!navigator.geolocation) { setStatus('denied'); return }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation([lat, lng])
        const address = await reverseGeocode(lat, lng)
        setUserAddress(address)
        await calculateRoute(lat, lng, selectedMode)
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    )
  }

  function resetLocation() {
    setUserLocation(null)
    setUserAddress('')
    setRouteSteps([])
    setRouteDistance(null)
    setDurations({ walk: null, matatu: null, drive: null })
    setStatus('idle')
    routeLayerRef.current?.remove()
    routeLayerRef.current = null
    userMarkerRef.current?.remove()
    userMarkerRef.current = null
    mapInstanceRef.current?.setView([property.latitude, property.longitude], 14)
  }

  const arrivalTime = (mins: number | null) => {
    if (!mins) return '--'
    const d = new Date(Date.now() + mins * 60_000)
    return d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const transportModes: Array<{ mode: TransportMode; icon: string; label: string }> = [
    { mode: 'walk',   icon: '🚶', label: 'Walk'   },
    { mode: 'matatu', icon: '🚌', label: 'Matatu' },
    { mode: 'drive',  icon: '🚗', label: 'Drive'  },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Destination header */}
      <div style={{
        background: '#0f0e0c', borderRadius: '14px', padding: '12px 14px',
      }}>
        <div style={{
          fontSize: '10px', color: 'rgba(255,255,255,0.45)',
          fontWeight: 600, textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', marginBottom: '3px',
        }}>
          Destination
        </div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
          {property.title}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          {property.estate ?? property.city ?? property.address ?? ''}
        </div>
      </div>

      {/* User location input or confirmed chip */}
      {!userLocation ? (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f0e0c', marginBottom: '2px' }}>
            Where are you now?
          </div>

          <PhotoLocationButton onLocation={handlePhotoLocation} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: '11px', color: '#b0a898' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
          </div>

          <button
            onClick={handleBrowserGPS}
            style={{
              width: '100%', padding: '12px 14px',
              background: '#f5f5f5',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '10px',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
            }}
          >
            <span style={{ fontSize: '20px' }}>📡</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f0e0c' }}>Use my GPS location</div>
              <div style={{ fontSize: '11px', color: '#b0a898' }}>May be approximate indoors</div>
            </div>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px',
          background: 'rgba(26,107,74,0.08)',
          border: '1px solid rgba(26,107,74,0.2)',
          borderRadius: '12px',
        }}>
          <div style={{ width: '10px', height: '10px', background: '#4285f4', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10px', color: '#b0a898', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '1px',
            }}>
              Your location
            </div>
            <div style={{
              fontSize: '13px', fontWeight: 700, color: '#0f0e0c',
              whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {userAddress || 'Location found'}
            </div>
          </div>
          <button
            onClick={resetLocation}
            style={{
              background: 'none', border: 'none',
              color: '#b0a898', fontSize: '18px',
              cursor: 'pointer', padding: 0, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Loading states */}
      {(status === 'locating' || status === 'routing') && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 14px',
          background: 'rgba(26,107,74,0.06)',
          borderRadius: '12px',
        }}>
          <div style={{
            width: '16px', height: '16px', flexShrink: 0,
            border: '2px solid #1a6b4a', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: '13px', color: '#1a6b4a', fontWeight: 600 }}>
            {status === 'locating' ? 'Finding your location…' : 'Calculating route…'}
          </div>
        </div>
      )}

      {/* GPS denied */}
      {status === 'denied' && (
        <div style={{
          padding: '12px 14px',
          background: 'rgba(220,38,38,0.06)',
          border: '1px solid rgba(220,38,38,0.15)',
          borderRadius: '12px',
          fontSize: '13px', color: '#dc2626',
        }}>
          📵 Location denied. Enable GPS in browser settings or use the photo option above.
        </div>
      )}

      {/* MAP */}
      <div
        ref={mapRef}
        style={{
          height: '220px', borderRadius: '16px',
          overflow: 'hidden', background: '#e8ede8',
        }}
      />

      {/* Transport mode selector */}
      {userLocation && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
          {transportModes.map(({ mode, icon, label }) => {
            const mins     = durations[mode]
            const isActive = selectedMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                style={{
                  padding: '12px 8px',
                  background:  isActive ? '#fff' : '#f5f5f5',
                  border:      `2px solid ${isActive ? '#1a6b4a' : 'transparent'}`,
                  borderRadius: '14px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column' as const,
                  alignItems: 'center', gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '22px' }}>{icon}</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: isActive ? '#0f0e0c' : '#6b6055' }}>
                  {mins ? `${mins} min` : '–'}
                </div>
                <div style={{ fontSize: '10px', color: '#b0a898' }}>{arrivalTime(mins)}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Distance chip */}
      {routeDistance && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b6055' }}>
          <span>📍</span>
          <span>{routeDistance} km total distance</span>
        </div>
      )}

      {/* TURN BY TURN DIRECTIONS */}
      {routeSteps.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c' }}>
              Turn by turn directions
            </div>
            <div style={{ fontSize: '11px', color: '#1a6b4a', fontWeight: 600 }}>
              {routeSteps.length} steps
            </div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column' as const, gap: '5px',
            maxHeight: '260px', overflowY: 'auto' as const,
          }}>
            {routeSteps.map((step, i) => (
              <div
                key={i}
                onClick={() => setActiveStep(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px',
                  background: i === activeStep
                    ? 'rgba(26,107,74,0.08)'
                    : i < activeStep ? 'rgba(0,0,0,0.02)' : '#fff',
                  border: `1px solid ${i === activeStep ? 'rgba(26,107,74,0.25)' : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  opacity: i < activeStep ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i === activeStep ? '#1a6b4a' : i < activeStep ? '#f0f0f0' : '#f5f5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '14px',
                }}>
                  {i < activeStep
                    ? <span style={{ fontSize: '11px', color: '#b0a898' }}>✓</span>
                    : <span>{getStepIcon(step.type, step.modifier)}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: i === activeStep ? 700 : 500,
                    color: i < activeStep ? '#b0a898' : '#0f0e0c',
                    marginBottom: '2px', lineHeight: 1.4,
                    textDecoration: i < activeStep ? 'line-through' : 'none',
                  }}>
                    {step.instruction}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: i === activeStep ? '#1a6b4a' : '#b0a898',
                    fontWeight: i === activeStep ? 600 : 400,
                  }}>
                    {step.distance}
                    {step.duration > 0 && ` · ~${step.duration} min`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prev / Next step buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep(prev => Math.max(prev - 1, 0))}
                style={{
                  flex: 1, padding: '11px',
                  background: '#f5f5f5', border: 'none', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 600, color: '#0f0e0c',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ← Previous
              </button>
            )}
            {activeStep < routeSteps.length - 1 && (
              <button
                onClick={() => setActiveStep(prev => Math.min(prev + 1, routeSteps.length - 1))}
                style={{
                  flex: 1, padding: '11px',
                  background: '#1a6b4a', color: '#fff',
                  border: 'none', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                Next step →
              </button>
            )}
          </div>

          {activeStep === routeSteps.length - 1 && (
            <div style={{
              marginTop: '8px', padding: '12px',
              background: 'rgba(26,107,74,0.08)',
              border: '1px solid rgba(26,107,74,0.2)',
              borderRadius: '12px',
              textAlign: 'center' as const,
              fontSize: '13px', fontWeight: 700, color: '#1a6b4a',
            }}>
              📍 You have arrived at your destination
            </div>
          )}
        </div>
      )}

      {/* Google / Apple Maps deep link */}
      {userLocation && (
        <a
          href={getMapsUrl(
            userLocation[0], userLocation[1],
            property.latitude, property.longitude,
            selectedMode,
          )}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '14px',
            background: '#0f0e0c', color: '#fff',
            borderRadius: '14px', fontSize: '14px', fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '18px' }}>{isIOS() ? '🍎' : '🗺'}</span>
          Open in {isIOS() ? 'Apple Maps' : 'Google Maps'}
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: '2px' }}>
            · voice navigation
          </span>
        </a>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '12px',
          background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '12px',
          fontSize: '13px', fontWeight: 600, color: '#6b6055',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        × Close navigation
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Inline photo location capture ────────────────────────────────────────────
function PhotoLocationButton({
  onLocation,
}: {
  onLocation: (lat: number, lng: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'processing' | 'failed'>('idle')

  async function handlePhoto(files: FileList | null) {
    if (!files?.length) return
    const file = files[0]
    setState('processing')
    try {
      const exifr = (await import('exifr')).default
      const gps   = await exifr.gps(file)
      if (gps?.latitude && gps?.longitude) {
        if (inputRef.current) inputRef.current.value = ''
        setState('idle')
        onLocation(gps.latitude, gps.longitude)
      } else {
        throw new Error('No GPS')
      }
    } catch {
      if (inputRef.current) inputRef.current.value = ''
      setState('failed')
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handlePhoto(e.target.files)}
      />
      <button
        type="button"
        onClick={() => { setState('idle'); inputRef.current?.click() }}
        disabled={state === 'processing'}
        style={{
          width: '100%', padding: '13px 14px',
          background: 'rgba(26,107,74,0.08)',
          border: '1.5px solid rgba(26,107,74,0.25)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: state === 'processing' ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', textAlign: 'left' as const,
        }}
      >
        <div style={{
          width: '40px', height: '40px', background: '#1a6b4a',
          borderRadius: '12px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, fontSize: '20px',
        }}>
          {state === 'processing' ? (
            <div style={{
              width: '18px', height: '18px',
              border: '2px solid #fff', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          ) : '📷'}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', marginBottom: '2px' }}>
            {state === 'processing'  ? 'Reading your location…'
              : state === 'failed'  ? 'Try again — enable camera GPS'
              : 'Take a photo to locate me'}
          </div>
          <div style={{ fontSize: '11px', color: '#6b6055' }}>
            {state === 'processing' ? 'Photo will be discarded immediately'
              : state === 'failed'  ? 'Settings → Camera → Location → Allow'
              : 'Most accurate · photo never saved'}
          </div>
        </div>
      </button>
    </div>
  )
}
