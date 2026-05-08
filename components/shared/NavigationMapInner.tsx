'use client'

import { useEffect, useRef, useState } from 'react'
import { getRealRoute } from '@/lib/routing'

interface NavProperty {
  title:     string
  address:   string
  latitude:  number
  longitude: number
}

export interface NavRoute {
  distMetres:          number
  distKm:              string
  walkMin:             number
  driveMin:            number
  matatuMin:           number
  walkDurationText?:   string
  driveDurationText?:  string
  matatuDurationText?: string
  rawKm:               number
}

export interface NavigationMapInnerProps {
  property:          NavProperty
  onRouteCalculated: (route: NavRoute) => void
  onLocationUpdate:  (loc: { lat: number; lng: number; heading?: number; speed?: number }) => void
  travelMode:        'walking' | 'driving' | 'matatu'
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
          0%   { transform:translate(-50%,-50%) scale(1); opacity:1 }
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

/** Inline Haversine — used for arrival detection only, no API call needed. */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6_371_000
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function NavigationMapInner({
  property,
  onRouteCalculated,
  onLocationUpdate,
}: NavigationMapInnerProps) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInstRef      = useRef<import('leaflet').Map | null>(null)
  const userMarkerRef   = useRef<import('leaflet').Marker | null>(null)
  const routeLineRef    = useRef<import('leaflet').Layer | null>(null)
  const watchIdRef      = useRef<number | null>(null)
  const lastOsrmLocRef  = useRef<[number, number] | null>(null)
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !mapRef.current) return

      const map = L.map(mapRef.current, {
        zoomControl:        false,
        attributionControl: false,
        dragging:           true,
        touchZoom:          true,
      })
      mapInstRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Green property pin
      const escaped = property.title.replace(/"/g, '&quot;').slice(0, 32)
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
      map.setView([property.latitude, property.longitude], 15)

      // Real-time GPS watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return
          const { latitude, longitude, heading, speed } = pos.coords
          const userLoc: [number, number] = [latitude, longitude]

          // ── 1. Update user marker ──────────────────────────────────────
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userLoc)
            userMarkerRef.current.setIcon(buildUserIcon(L, heading ?? undefined))
          } else {
            userMarkerRef.current = L.marker(userLoc, {
              icon: buildUserIcon(L, heading ?? undefined),
              zIndexOffset: 1000,
            }).addTo(map)
            map.fitBounds(
              L.latLngBounds([userLoc, [property.latitude, property.longitude]]),
              { padding: [80, 80] },
            )
          }

          // ── 2. Keep map centred on user ────────────────────────────────
          map.panTo(userLoc, { animate: true })

          // ── 3. Haversine for fast arrival check ────────────────────────
          const distMetres = haversineM(latitude, longitude, property.latitude, property.longitude)

          onLocationUpdate({ lat: latitude, lng: longitude, heading: heading ?? undefined, speed: speed ?? undefined })

          // ── 4. Arrival at ≤ 50 m ──────────────────────────────────────
          if (distMetres <= 50) {
            setArrived(true)
            navigator.geolocation.clearWatch(watchIdRef.current!)
            watchIdRef.current = null
            return
          }

          // ── 5. OSRM call — throttled to once per ~50 m moved ──────────
          const last = lastOsrmLocRef.current
          const movedEnough = !last || Math.hypot(latitude - last[0], longitude - last[1]) > 0.00045

          if (movedEnough) {
            lastOsrmLocRef.current = [latitude, longitude]

            // Emit Haversine estimate immediately so the UI isn't blank
            const rawKm = distMetres / 1000
            onRouteCalculated({
              distMetres: Math.round(distMetres),
              distKm:     distMetres < 1000 ? `${Math.round(distMetres)}m` : `${rawKm.toFixed(1)}km`,
              walkMin:    Math.max(1, Math.round((rawKm / 4)  * 60)),
              driveMin:   Math.max(1, Math.round((rawKm / 30) * 60)),
              matatuMin:  Math.max(1, Math.round((rawKm / 25) * 60)),
              rawKm,
            })

            // Show straight-line route while waiting for OSRM
            routeLineRef.current?.remove()
            routeLineRef.current = L.polyline(
              [userLoc, [property.latitude, property.longitude]],
              { color: C.blue, weight: 4, dashArray: '10 8', opacity: 0.6, lineCap: 'round' },
            ).addTo(map)

            // Async OSRM fetch — replaces straight line once it arrives
            void (async () => {
              const result = await getRealRoute(
                latitude, longitude,
                property.latitude, property.longitude,
              )
              if (!result || cancelled) return

              // Replace straight line with real road polyline
              routeLineRef.current?.remove()
              routeLineRef.current = L.geoJSON(
                result.geometry as Parameters<typeof L.geoJSON>[0],
                { style: { color: C.blue, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' } },
              ).addTo(map)

              // Emit accurate OSRM-based route info
              onRouteCalculated({
                distMetres:         result.distanceMetres,
                distKm:             result.distanceText,
                walkMin:            Math.max(1, Math.round(result.durationSeconds      / 60)),
                driveMin:           Math.max(1, Math.round(result.driveDurationSeconds / 60)),
                matatuMin:          Math.max(1, Math.round((result.driveDurationSeconds + 300) / 60)),
                walkDurationText:   result.walkDurationText,
                driveDurationText:  result.driveDurationText,
                matatuDurationText: result.matatuDurationText,
                rawKm:              result.distanceMetres / 1000,
              })
            })()
          }
        },
        (err) => { console.warn('GPS error:', err.message) },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
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
      mapInstRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (arrived) {
    return (
      <div className="flex-1 flex items-center justify-center bg-accent-l flex-col gap-4 p-8 w-full h-full">
        <div className="text-6xl">🎉</div>
        <h2 className="font-serif text-3xl text-accent text-center">You have arrived!</h2>
        <p className="font-sans text-muted  text-center text-sm">{property.title}</p>
        <p className="font-sans text-muted2 text-center text-xs">{property.address}</p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '300px' }}
      aria-label="Navigation map"
    />
  )
}
