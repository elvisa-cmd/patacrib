'use client'

import { useEffect, useRef, useState } from 'react'
import { getWalkingRoute }              from '@/lib/routing'
import type { RouteStep }               from '@/lib/routing'

interface NavProperty {
  title:     string
  address:   string
  latitude:  number
  longitude: number
}

export interface NavRoute {
  distMetres:    number
  distanceText:  string
  walkMinutes:   number
  walkText:      string
  driveMinutes:  number
  driveText:     string
  matatuMinutes: number
  matatuText:    string
  steps:         RouteStep[]
}

export interface NavigationMapInnerProps {
  property:         NavProperty
  onRouteReady:     (route: NavRoute) => void
  onLocationUpdate: (loc: {
    lat:        number
    lng:        number
    heading?:   number
    arrived:    boolean
    distMetres: number
    accuracy?:  number
  }) => void
  travelMode: 'walking' | 'driving' | 'matatu'
}

const C = {
  accent: '#1a6b4a',
  blue:   '#2563eb',
  blueA:  'rgba(37,99,235,0.15)',
  white:  '#ffffff',
} as const

function buildUserIcon(L: typeof import('leaflet'), heading?: number) {
  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes navPulse {
          0%   { transform:translate(-50%,-50%) scale(1);   opacity:1 }
          100% { transform:translate(-50%,-50%) scale(2.2); opacity:0 }
        }
      </style>
      <div style="position:relative;width:28px;height:28px;">
        <div style="
          position:absolute;top:50%;left:50%;
          width:56px;height:56px;
          background:${C.blueA};border-radius:50%;
          animation:navPulse 2s infinite;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:28px;height:28px;
          background:${C.white};border-radius:50%;
          box-shadow:0 2px 12px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:18px;height:18px;
          background:${C.blue};border-radius:50%;
        "></div>
        ${heading != null ? `
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-100%) rotate(${heading}deg);
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-bottom:12px solid ${C.blue};
          margin-top:-14px;
        "></div>` : ''}
      </div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
  })
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6_371_000
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lng2 - lng1) * (Math.PI / 180)
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function NavigationMapInner({
  property,
  onRouteReady,
  onLocationUpdate,
}: NavigationMapInnerProps) {
  const mapRef            = useRef<HTMLDivElement>(null)
  const mapInstRef        = useRef<import('leaflet').Map | null>(null)
  const leafletRef        = useRef<typeof import('leaflet') | null>(null)
  const userMarkerRef     = useRef<import('leaflet').Marker | null>(null)
  const routeLineRef      = useRef<import('leaflet').Layer | null>(null)
  const accuracyCircleRef = useRef<any>(null)
  const watchIdRef        = useRef<number | null>(null)   // acquisition watch
  const navWatchRef       = useRef<number | null>(null)   // live navigation watch
  const lastOsrmLocRef    = useRef<[number, number] | null>(null)
  const userLocRef        = useRef<[number, number] | null>(null)
  const startPreciseRef   = useRef<(() => void) | null>(null)

  const [accuracyLabel, setAccuracyLabel] = useState('📡 Getting your precise location…')
  const [accuracyColor, setAccuracyColor] = useState('#b0a898')
  const [showRetry,     setShowRetry]     = useState(false)
  const [gpsLocked,     setGpsLocked]     = useState(false)
  const [showNoGps,     setShowNoGps]     = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !mapRef.current) return

      leafletRef.current = L

      const map = L.map(mapRef.current, {
        zoomControl:        false,
        attributionControl: false,
        dragging:           true,
        touchZoom:          true,
      })
      mapInstRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      // ── Property pin ─────────────────────────────────────────────────────────
      const escaped  = property.title.replace(/"/g, '&quot;').slice(0, 32)
      const propIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:${C.accent};color:${C.white};
              padding:6px 14px;font-weight:900;font-size:13px;font-family:sans-serif;
              box-shadow:0 4px 20px rgba(26,107,74,0.5);white-space:nowrap;border-radius:2px;
            ">🏠 ${escaped}</div>
            <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${C.accent};"></div>
            <div style="width:8px;height:8px;background:${C.accent};border-radius:50%;margin-top:-2px;"></div>
          </div>`,
        iconSize:   [200, 56],
        iconAnchor: [100, 56],
      })
      L.marker([property.latitude, property.longitude], { icon: propIcon }).addTo(map)
      map.setView([property.latitude, property.longitude], 15)

      // ── Helpers ───────────────────────────────────────────────────────────────

      function placeUserDot(lat: number, lng: number, heading?: number, fitBounds = false) {
        userLocRef.current = [lat, lng]
        const icon = buildUserIcon(L, heading)
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng])
          userMarkerRef.current.setIcon(icon)
        } else {
          userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map)
        }
        if (fitBounds) {
          map.fitBounds(
            L.latLngBounds([[lat, lng], [property.latitude, property.longitude]]),
            { padding: [80, 80] },
          )
        }
      }

      function drawAccuracyCircle(lat: number, lng: number, radius: number) {
        accuracyCircleRef.current?.remove()
        accuracyCircleRef.current = L.circle([lat, lng], {
          radius,
          color:       C.accent,
          fillColor:   C.accent,
          fillOpacity: 0.1,
          weight:      1,
          dashArray:   '4',
        }).addTo(map)
      }

      async function calculateRoute(loc: [number, number]) {
        const [lat, lng] = loc
        const distMetres = haversineM(lat, lng, property.latitude, property.longitude)
        const roadM      = distMetres * 1.4

        // Haversine estimate first — never shows blank times
        onRouteReady({
          distMetres:    Math.round(distMetres),
          distanceText:  distMetres < 1000 ? `${Math.round(distMetres)}m` : `${(distMetres / 1000).toFixed(1)}km`,
          walkMinutes:   Math.max(1, Math.round((roadM / 4000)  * 60)),
          walkText:      `${Math.max(1, Math.round((roadM / 4000)  * 60))} min`,
          driveMinutes:  Math.max(1, Math.round((roadM / 25000) * 60)),
          driveText:     `${Math.max(1, Math.round((roadM / 25000) * 60))} min`,
          matatuMinutes: Math.max(1, Math.round((roadM / 25000) * 60)) + 5,
          matatuText:    `${Math.max(1, Math.round((roadM / 25000) * 60)) + 5} min`,
          steps:         [],
        })

        routeLineRef.current?.remove()
        routeLineRef.current = L.polyline(
          [[lat, lng], [property.latitude, property.longitude]],
          { color: '#999', weight: 3, dashArray: '10 8', opacity: 0.5, lineCap: 'round' },
        ).addTo(map)

        const result = await getWalkingRoute(lat, lng, property.latitude, property.longitude)
        if (!result || cancelled) return

        routeLineRef.current?.remove()
        const geoLayer = L.geoJSON(
          result.geometry as Parameters<typeof L.geoJSON>[0],
          { style: { color: C.accent, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' } },
        ).addTo(map)
        routeLineRef.current = geoLayer
        const bounds = geoLayer.getBounds()
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] })

        onRouteReady({
          distMetres:    result.distanceMetres,
          distanceText:  result.distanceText,
          walkMinutes:   result.walkMinutes,
          walkText:      result.walkText,
          driveMinutes:  result.driveMinutes,
          driveText:     result.driveText,
          matatuMinutes: result.matatuMinutes,
          matatuText:    result.matatuText,
          steps:         result.steps,
        })
      }

      // ── Navigation watch (live updates after GPS is locked) ───────────────────
      function startNavWatch() {
        if (navWatchRef.current !== null) return
        navWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            if (cancelled) return
            const { latitude, longitude, heading, accuracy: acc } = pos.coords

            const label = acc <= 15 ? `✅ Navigating · ±${Math.round(acc)}m`
              : acc <= 50           ? `📍 Good GPS · ±${Math.round(acc)}m`
              : `⚠️ Move outside for better GPS…`
            const color = acc <= 15 ? '#1a6b4a' : acc <= 50 ? '#e8a020' : '#dc2626'
            setAccuracyLabel(label)
            setAccuracyColor(color)

            placeUserDot(latitude, longitude, heading ?? undefined, false)
            drawAccuracyCircle(latitude, longitude, acc)
            map.panTo([latitude, longitude], { animate: true })

            const distMetres = haversineM(latitude, longitude, property.latitude, property.longitude)
            const arrived    = distMetres <= 50
            onLocationUpdate({ lat: latitude, lng: longitude, heading: heading ?? undefined, arrived, distMetres, accuracy: Math.round(acc) })

            if (arrived) {
              navigator.geolocation.clearWatch(navWatchRef.current!)
              navWatchRef.current = null
              return
            }

            const last        = lastOsrmLocRef.current
            const movedEnough = !last || Math.hypot(latitude - last[0], longitude - last[1]) > 0.00027
            if (movedEnough) {
              lastOsrmLocRef.current = [latitude, longitude]
              void calculateRoute([latitude, longitude])
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        )
      }

      // ── Precise GPS acquisition ───────────────────────────────────────────────
      function startPreciseLocation() {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }

        setAccuracyLabel('📡 Getting your precise location…')
        setAccuracyColor('#b0a898')
        setShowRetry(false)
        setGpsLocked(false)

        let bestPos:  GeolocationPosition | null = null
        let attempts  = 0
        let resolved  = false

        function finish(pos: GeolocationPosition) {
          if (resolved || cancelled) return
          resolved = true
          clearTimeout(safetyTimer)
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
          }

          const acc   = pos.coords.accuracy
          const label = acc <= 15 ? `✅ Navigating · ±${Math.round(acc)}m`
            : acc <= 50           ? `📍 Good GPS · ±${Math.round(acc)}m`
            : `⚠️ Move outside for better GPS…`
          const color = acc <= 15 ? '#1a6b4a' : acc <= 50 ? '#e8a020' : '#dc2626'
          setAccuracyLabel(label)
          setAccuracyColor(color)
          setGpsLocked(true)
          setShowRetry(acc > 50)

          placeUserDot(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? undefined, true)
          drawAccuracyCircle(pos.coords.latitude, pos.coords.longitude, acc)

          const distM = haversineM(pos.coords.latitude, pos.coords.longitude, property.latitude, property.longitude)
          onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading ?? undefined, arrived: false, distMetres: distM, accuracy: Math.round(acc) })
          void calculateRoute([pos.coords.latitude, pos.coords.longitude])
          startNavWatch()
        }

        // Hard stop after 20 s — use whatever we have
        const safetyTimer = setTimeout(() => {
          if (resolved || cancelled) return
          if (bestPos) {
            finish(bestPos)
          } else {
            resolved = true
            setAccuracyLabel("📍 Tap 'Open in Google Maps' for turn-by-turn directions")
            setAccuracyColor('#dc2626')
            setShowRetry(true)
            setShowNoGps(true)
          }
        }, 20000)

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            if (resolved || cancelled) return
            attempts++

            if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
              bestPos = pos

              const acc   = pos.coords.accuracy
              const label = acc > 50
                ? `📡 Getting your precise location… ±${Math.round(acc)}m`
                : `📍 Refining location… ±${Math.round(acc)}m`
              const color = acc > 50 ? '#b0a898' : '#e8a020'
              setAccuracyLabel(label)
              setAccuracyColor(color)

              placeUserDot(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? undefined, !userMarkerRef.current)
              drawAccuracyCircle(pos.coords.latitude, pos.coords.longitude, acc)

              const distM = haversineM(pos.coords.latitude, pos.coords.longitude, property.latitude, property.longitude)
              onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading ?? undefined, arrived: false, distMetres: distM, accuracy: Math.round(acc) })

              if (attempts === 1) void calculateRoute([pos.coords.latitude, pos.coords.longitude])
            }

            // Stop at 15 m accuracy or after 8 attempts
            if (pos.coords.accuracy <= 15 || attempts >= 8) {
              finish(bestPos!)
            }
          },
          (err) => {
            if (resolved || cancelled) return
            clearTimeout(safetyTimer)
            resolved = true
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current)
              watchIdRef.current = null
            }

            if (err.code === 1) {
              setAccuracyLabel("Enable location to get directions from your position")
              setAccuracyColor('#dc2626')
              setShowRetry(false)
              setShowNoGps(true)
            } else if (bestPos) {
              finish(bestPos)
            } else {
              setAccuracyLabel("📍 Tap 'Open in Google Maps' for turn-by-turn directions")
              setAccuracyColor('#dc2626')
              setShowRetry(true)
              setShowNoGps(true)
            }
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
        )
      }

      if (!navigator.geolocation) {
        setAccuracyLabel("Enable location to get directions from your position")
        setAccuracyColor('#dc2626')
        setShowNoGps(true)
        return
      }

      startPreciseRef.current = startPreciseLocation
      startPreciseLocation()
    }

    init()

    return () => {
      cancelled = true
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (navWatchRef.current !== null) {
        navigator.geolocation.clearWatch(navWatchRef.current)
        navWatchRef.current = null
      }
      mapInstRef.current?.remove()
      mapInstRef.current = null
      leafletRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function recenterOnMe() {
    const loc = userLocRef.current
    const map = mapInstRef.current
    const L   = leafletRef.current
    if (!loc || !map || !L) return
    map.fitBounds(
      L.latLngBounds([loc, [property.latitude, property.longitude]]),
      { padding: [80, 80] },
    )
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
      <div ref={mapRef} className="w-full h-full" aria-label="Navigation map" />

      {/* Accuracy label bar */}
      <div
        style={{
          position:       'absolute',
          top:            '12px',
          left:           '50%',
          transform:      'translateX(-50%)',
          zIndex:         1000,
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          background:     'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)',
          borderRadius:   '20px',
          padding:        '6px 14px',
          boxShadow:      '0 2px 12px rgba(0,0,0,0.2)',
          maxWidth:       'calc(100vw - 32px)',
        }}
      >
        {!gpsLocked && !showNoGps && (
          <span
            style={{
              width:        '10px',
              height:       '10px',
              border:       '2px solid rgba(255,255,255,0.3)',
              borderTop:    '2px solid #fff',
              borderRadius: '50%',
              display:      'inline-block',
              animation:    'spin 0.8s linear infinite',
              flexShrink:   0,
            }}
          />
        )}
        <span style={{ fontSize: '11px', fontWeight: 600, color: accuracyColor, whiteSpace: 'nowrap' }}>
          {accuracyLabel}
        </span>
        {showRetry && !showNoGps && (
          <button
            type="button"
            onClick={() => startPreciseRef.current?.()}
            style={{
              background:   'rgba(26,107,74,0.25)',
              color:        '#7fe0b4',
              border:       '1px solid rgba(26,107,74,0.4)',
              borderRadius: '10px',
              padding:      '2px 10px',
              fontSize:     '11px',
              fontWeight:   700,
              cursor:       'pointer',
              whiteSpace:   'nowrap',
              flexShrink:   0,
            }}
          >
            🔄 Retry
          </button>
        )}
      </div>

      {/* No-GPS overlay — shown when location is unavailable */}
      {showNoGps && (
        <div
          style={{
            position:       'absolute',
            bottom:         '16px',
            left:           '16px',
            right:          '16px',
            zIndex:         1000,
            background:     '#fff',
            borderRadius:   '12px',
            padding:        '16px',
            boxShadow:      '0 4px 20px rgba(0,0,0,0.18)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '10px',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f0e0c', textAlign: 'center', margin: 0 }}>
            Enable location to get directions from your position
          </p>
          <button
            type="button"
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`)}
            style={{
              width:          '100%',
              padding:        '12px',
              background:     '#1a6b4a',
              color:          '#fff',
              border:         'none',
              borderRadius:   '10px',
              fontSize:       '13px',
              fontWeight:     700,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
            }}
          >
            🗺 Open in Google Maps
          </button>
          {showRetry && (
            <button
              type="button"
              onClick={() => { setShowNoGps(false); startPreciseRef.current?.() }}
              style={{
                fontSize:   '12px',
                color:      '#6b6055',
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                padding:    '4px',
              }}
            >
              🔄 Try enabling GPS again
            </button>
          )}
        </div>
      )}

      {/* Re-center button */}
      {gpsLocked && (
        <button
          type="button"
          onClick={recenterOnMe}
          aria-label="Re-center on my location"
          style={{
            position:      'absolute',
            bottom:        '16px',
            right:         '16px',
            zIndex:        1000,
            width:         '40px',
            height:        '40px',
            background:    '#fff',
            border:        '1px solid #e0dbd4',
            borderRadius:  '50%',
            boxShadow:     '0 2px 8px rgba(0,0,0,0.18)',
            fontSize:      '18px',
            cursor:        'pointer',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
          }}
        >
          ◎
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
