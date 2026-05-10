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
  onLocationUpdate: (loc: { lat: number; lng: number; heading?: number; arrived: boolean; distMetres: number }) => void
  travelMode:       'walking' | 'driving' | 'matatu'
}

type GpsStatus = 'locating' | 'refining' | 'navigating' | 'unavailable'

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

const STATUS_UI: Record<GpsStatus, { text: string; pulse: boolean; warn: boolean }> = {
  locating:    { text: 'Locating you…',                            pulse: true,  warn: false },
  refining:    { text: 'Refining location…',                       pulse: true,  warn: false },
  navigating:  { text: 'Navigating',                               pulse: false, warn: false },
  unavailable: { text: 'Location unavailable · showing property only', pulse: false, warn: true  },
}

export default function NavigationMapInner({
  property,
  onRouteReady,
  onLocationUpdate,
}: NavigationMapInnerProps) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInstRef      = useRef<import('leaflet').Map | null>(null)
  const leafletRef      = useRef<typeof import('leaflet') | null>(null)
  const userMarkerRef   = useRef<import('leaflet').Marker | null>(null)
  const routeLineRef    = useRef<import('leaflet').Layer | null>(null)
  const watchIdRef      = useRef<number | null>(null)
  const lastOsrmLocRef  = useRef<[number, number] | null>(null)
  const hasPreciseRef   = useRef(false)

  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('locating')

  useEffect(() => {
    if (!mapRef.current || mapInstRef.current) return

    let cancelled = false

    async function init() {
      // ── 1. Load Leaflet and render map + property pin immediately ──────────
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

      // Property pin — shown immediately, no GPS needed
      const escaped  = property.title.replace(/"/g, '&quot;').slice(0, 32)
      const propIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:${C.accent};color:${C.white};
              padding:6px 14px;
              font-weight:900;font-size:13px;font-family:sans-serif;
              box-shadow:0 4px 20px rgba(26,107,74,0.5);
              white-space:nowrap;border-radius:2px;
            ">🏠 ${escaped}</div>
            <div style="
              width:0;height:0;
              border-left:8px solid transparent;
              border-right:8px solid transparent;
              border-top:10px solid ${C.accent};
            "></div>
            <div style="
              width:8px;height:8px;
              background:${C.accent};border-radius:50%;margin-top:-2px;
            "></div>
          </div>`,
        iconSize:   [200, 56],
        iconAnchor: [100, 56],
      })
      L.marker([property.latitude, property.longitude], { icon: propIcon }).addTo(map)
      // Map is visible immediately, centred on the property
      map.setView([property.latitude, property.longitude], 15)

      // ── Helper: place or update the blue user dot ──────────────────────────
      function placeUserDot(lat: number, lng: number, heading?: number, fitBounds = false) {
        const icon = buildUserIcon(L, heading)
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng])
          userMarkerRef.current.setIcon(icon)
        } else {
          userMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map)
          if (fitBounds) {
            map.fitBounds(
              L.latLngBounds([[lat, lng], [property.latitude, property.longitude]]),
              { padding: [80, 80] },
            )
          }
        }
      }

      // ── Stage 1: Fast rough location (no high accuracy, 2 s timeout) ──────
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return
          setGpsStatus('refining')
          placeUserDot(pos.coords.latitude, pos.coords.longitude, undefined, true)
        },
        (err) => { console.log('rough location failed', err) },
        { enableHighAccuracy: false, timeout: 2000, maximumAge: 30_000 },
      )

      // ── Stage 2: Precise continuous GPS ───────────────────────────────────
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return
          const { latitude, longitude, heading } = pos.coords

          if (!hasPreciseRef.current) {
            hasPreciseRef.current = true
            setGpsStatus('navigating')
          }

          placeUserDot(latitude, longitude, heading ?? undefined, !userMarkerRef.current)
          map.panTo([latitude, longitude], { animate: true })

          const distMetres = haversineM(latitude, longitude, property.latitude, property.longitude)
          const arrived    = distMetres <= 50

          onLocationUpdate({ lat: latitude, lng: longitude, heading: heading ?? undefined, arrived, distMetres })

          if (arrived) {
            navigator.geolocation.clearWatch(watchIdRef.current!)
            watchIdRef.current = null
            return
          }

          // OSRM — throttled to once per ~50 m of movement
          const last        = lastOsrmLocRef.current
          const movedEnough = !last || Math.hypot(latitude - last[0], longitude - last[1]) > 0.00045

          if (movedEnough) {
            lastOsrmLocRef.current = [latitude, longitude]

            // Emit Haversine estimate immediately so UI isn't blank
            const roadM = distMetres * 1.4
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

            // Draw straight-line route while OSRM fetches
            routeLineRef.current?.remove()
            routeLineRef.current = L.polyline(
              [[latitude, longitude], [property.latitude, property.longitude]],
              { color: C.blue, weight: 4, dashArray: '10 8', opacity: 0.6, lineCap: 'round' },
            ).addTo(map)

            // Replace with real road polyline once OSRM responds
            void (async () => {
              const result = await getWalkingRoute(latitude, longitude, property.latitude, property.longitude)
              if (!result || cancelled) return

              routeLineRef.current?.remove()
              routeLineRef.current = L.geoJSON(
                result.geometry as Parameters<typeof L.geoJSON>[0],
                { style: { color: C.blue, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' } },
              ).addTo(map)

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
            })()
          }
        },
        (err) => {
          console.log('precise location failed', err)
          // Only mark unavailable if we never got a precise fix
          if (!hasPreciseRef.current && !cancelled) {
            setGpsStatus('unavailable')
          }
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
      )
    }

    init()

    return () => {
      cancelled = true
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      mapInstRef.current?.remove()
      mapInstRef.current  = null
      leafletRef.current  = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ui = STATUS_UI[gpsStatus]

  return (
    <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
      <div
        ref={mapRef}
        className="w-full h-full"
        aria-label="Navigation map"
      />

      {/* GPS status badge — overlaid on the map, never blocks it */}
      <div
        className={`
          absolute top-3 left-1/2 -translate-x-1/2 z-[1000]
          flex items-center gap-2 px-3 py-1.5
          rounded-full shadow-md pointer-events-none
          ${ui.warn
            ? 'bg-white/95 border border-amber-300'
            : 'bg-black/70 backdrop-blur-sm'
          }
        `}
      >
        {ui.pulse && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0"
            aria-hidden="true"
          />
        )}
        {!ui.pulse && !ui.warn && gpsStatus === 'navigating' && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"
            style={{ background: C.accent }}
            aria-hidden="true"
          />
        )}
        {ui.warn && (
          <span className="text-amber-500 text-xs flex-shrink-0" aria-hidden="true">⚠</span>
        )}
        <span
          className={`font-sans text-[11px] font-semibold whitespace-nowrap ${
            ui.warn ? 'text-amber-700' : 'text-white'
          }`}
        >
          {ui.text}
        </span>
      </div>
    </div>
  )
}
