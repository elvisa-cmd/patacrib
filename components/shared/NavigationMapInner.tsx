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

type GpsStatus = 'locating' | 'refining' | 'locked' | 'unavailable' | 'unavailable_cbd'

const CBD: [number, number] = [-1.286389, 36.817223]
const TARGET_ACCURACY = 20   // metres — stop acquiring when we hit this
const MAX_ATTEMPTS    = 5    // max watchPosition callbacks before we accept best
const SAFETY_TIMEOUT  = 15000 // ms — always resolve after this regardless

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

function getBadgeConfig(status: GpsStatus, acc: number | null): {
  text: string
  icon: 'spinner' | 'dot' | 'check' | 'warn'
  warn: boolean
} {
  if (status === 'unavailable')     return { text: 'Location unavailable · showing property only', icon: 'warn',    warn: true  }
  if (status === 'unavailable_cbd') return { text: 'No GPS · distances shown from CBD',            icon: 'warn',    warn: true  }
  if (status === 'locating' || acc === null)
    return { text: '📡 Getting your precise location…', icon: 'spinner', warn: false }
  if (acc > 50)
    return { text: `⚠️ Low accuracy ±${Math.round(acc)}m — move away from buildings`, icon: 'warn', warn: true }
  if (acc > 20)
    return { text: `📍 Location found · refining… ±${Math.round(acc)}m`, icon: 'dot', warn: false }
  return { text: `✅ Precise location locked · ±${Math.round(acc)}m`, icon: 'check', warn: false }
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
  const accuracyCircleRef = useRef<import('leaflet').Circle | null>(null)
  const acqWatchRef       = useRef<number | null>(null)   // accuracy-targeting watch
  const navWatchRef       = useRef<number | null>(null)   // live navigation watch
  const lastOsrmLocRef    = useRef<[number, number] | null>(null)
  const userLocRef        = useRef<[number, number] | null>(null)
  const retryFnRef        = useRef<(() => void) | null>(null)

  const [gpsStatus,  setGpsStatus]  = useState<GpsStatus>('locating')
  const [accuracy,   setAccuracy]   = useState<number | null>(null)
  const [showRetry,  setShowRetry]  = useState(false)

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
            setAccuracy(Math.round(acc))
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

      // ── GPS acquisition: watchPosition targeting accuracy ─────────────────────
      function startGpsAcquisition() {
        // Clear any previous acquisition watch
        if (acqWatchRef.current !== null) {
          navigator.geolocation.clearWatch(acqWatchRef.current)
          acqWatchRef.current = null
        }

        setGpsStatus('locating')
        setAccuracy(null)
        setShowRetry(false)

        let bestPos:  GeolocationPosition | null = null
        let attempts  = 0
        let resolved  = false

        function finish(pos: GeolocationPosition) {
          if (resolved || cancelled) return
          resolved = true
          clearTimeout(safetyTimer)
          if (acqWatchRef.current !== null) {
            navigator.geolocation.clearWatch(acqWatchRef.current)
            acqWatchRef.current = null
          }
          setGpsStatus('locked')
          setAccuracy(Math.round(pos.coords.accuracy))
          setShowRetry(pos.coords.accuracy > 50)
          placeUserDot(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? undefined, true)
          drawAccuracyCircle(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
          const distM = haversineM(pos.coords.latitude, pos.coords.longitude, property.latitude, property.longitude)
          onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading ?? undefined, arrived: false, distMetres: distM, accuracy: Math.round(pos.coords.accuracy) })
          void calculateRoute([pos.coords.latitude, pos.coords.longitude])
          startNavWatch()
        }

        // Safety timeout — use whatever we have after 15 s
        const safetyTimer = setTimeout(() => {
          if (resolved || cancelled) return
          if (bestPos) {
            finish(bestPos)
          } else {
            resolved = true
            setGpsStatus('unavailable_cbd')
            setShowRetry(true)
            void calculateRoute(CBD)
          }
        }, SAFETY_TIMEOUT)

        acqWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            if (resolved || cancelled) return
            attempts++

            // Keep the best (most accurate) reading
            if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
              bestPos = pos
              setAccuracy(Math.round(pos.coords.accuracy))

              // Update status based on live accuracy
              if (pos.coords.accuracy > 50) {
                setGpsStatus('locating')
              } else {
                setGpsStatus('refining')
              }

              // Update map with best-so-far position
              placeUserDot(pos.coords.latitude, pos.coords.longitude, pos.coords.heading ?? undefined, !userMarkerRef.current)
              drawAccuracyCircle(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)

              const distM = haversineM(pos.coords.latitude, pos.coords.longitude, property.latitude, property.longitude)
              onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading ?? undefined, arrived: false, distMetres: distM, accuracy: Math.round(pos.coords.accuracy) })

              // Emit route estimate from first fix so times are never blank
              if (attempts === 1) void calculateRoute([pos.coords.latitude, pos.coords.longitude])
            }

            // Finish when accurate enough or we've tried enough times
            if (pos.coords.accuracy <= TARGET_ACCURACY || attempts >= MAX_ATTEMPTS) {
              finish(bestPos!)
            }
          },
          (err) => {
            if (resolved || cancelled) return
            clearTimeout(safetyTimer)
            resolved = true
            if (acqWatchRef.current !== null) {
              navigator.geolocation.clearWatch(acqWatchRef.current)
              acqWatchRef.current = null
            }

            if (err.code === 1) {
              // Permission denied — no point retrying
              setGpsStatus('unavailable')
              setShowRetry(false)
              void calculateRoute(CBD)
            } else if (bestPos) {
              // Error but we already have a rough position — use it
              finish(bestPos)
            } else {
              setGpsStatus('unavailable_cbd')
              setShowRetry(true)
              void calculateRoute(CBD)
            }
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
        )
      }

      if (!navigator.geolocation) {
        setGpsStatus('unavailable_cbd')
        void calculateRoute(CBD)
        return
      }

      retryFnRef.current = startGpsAcquisition
      startGpsAcquisition()
    }

    init()

    return () => {
      cancelled = true
      if (acqWatchRef.current !== null) {
        navigator.geolocation.clearWatch(acqWatchRef.current)
        acqWatchRef.current = null
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

  const badge = getBadgeConfig(gpsStatus, accuracy)

  return (
    <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
      <div ref={mapRef} className="w-full h-full" aria-label="Navigation map" />

      {/* GPS status badge */}
      <div
        className={`
          absolute top-3 left-1/2 -translate-x-1/2 z-[1000]
          flex items-center gap-2 px-3 py-1.5
          rounded-full shadow-md pointer-events-none
          ${badge.warn ? 'bg-white/95 border border-amber-300' : 'bg-black/70 backdrop-blur-sm'}
        `}
      >
        {badge.icon === 'spinner' && (
          <span className="w-3 h-3 border-2 border-blue-300/40 border-t-blue-400 rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
        )}
        {badge.icon === 'dot' && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" aria-hidden="true" />
        )}
        {badge.icon === 'check' && (
          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: C.accent }} aria-hidden="true">✓</span>
        )}
        {badge.icon === 'warn' && (
          <span className="text-amber-500 text-xs flex-shrink-0" aria-hidden="true">⚠</span>
        )}
        <span className={`font-sans text-[11px] font-semibold whitespace-nowrap ${badge.warn ? 'text-amber-700' : 'text-white'}`}>
          {badge.text}
        </span>
      </div>

      {/* Re-center + Retry GPS buttons */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        {(gpsStatus === 'refining' || gpsStatus === 'locked') && (
          <button
            type="button"
            onClick={recenterOnMe}
            aria-label="Re-center on my location"
            className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
            style={{ fontSize: '18px' }}
          >
            ◎
          </button>
        )}
        {showRetry && (
          <button
            type="button"
            onClick={() => retryFnRef.current?.()}
            style={{
              background:   'rgba(26,107,74,0.1)',
              color:        '#1a6b4a',
              border:       '1px solid rgba(26,107,74,0.3)',
              borderRadius: '20px',
              padding:      '6px 14px',
              fontSize:     '12px',
              fontWeight:   600,
              cursor:       'pointer',
              whiteSpace:   'nowrap',
            }}
          >
            🔄 Retry GPS
          </button>
        )}
      </div>
    </div>
  )
}
