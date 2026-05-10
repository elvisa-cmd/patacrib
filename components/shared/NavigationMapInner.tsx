'use client'

import { useEffect, useRef } from 'react'
import { getWalkingRoute }   from '@/lib/routing'
import type { RouteStep }    from '@/lib/routing'

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
  property:          NavProperty
  onRouteReady:      (route: NavRoute) => void
  onLocationUpdate:  (loc: { lat: number; lng: number; heading?: number; arrived: boolean; distMetres: number }) => void
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
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstRef     = useRef<import('leaflet').Map | null>(null)
  const userMarkerRef  = useRef<import('leaflet').Marker | null>(null)
  const routeLineRef   = useRef<import('leaflet').Layer | null>(null)
  const watchIdRef     = useRef<number | null>(null)
  const lastOsrmLocRef = useRef<[number, number] | null>(null)

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
      map.setView([property.latitude, property.longitude], 15)

      // Real-time GPS watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return
          const { latitude, longitude, heading } = pos.coords
          const userLoc: [number, number] = [latitude, longitude]

          // Update user marker
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

          map.panTo(userLoc, { animate: true })

          // Haversine for fast arrival check
          const distMetres = haversineM(latitude, longitude, property.latitude, property.longitude)
          const arrived    = distMetres <= 50

          onLocationUpdate({ lat: latitude, lng: longitude, heading: heading ?? undefined, arrived, distMetres })

          if (arrived) {
            navigator.geolocation.clearWatch(watchIdRef.current!)
            watchIdRef.current = null
            return
          }

          // OSRM call — throttled to once per ~50 m moved
          const last         = lastOsrmLocRef.current
          const movedEnough  = !last || Math.hypot(latitude - last[0], longitude - last[1]) > 0.00045

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

            // Show straight-line route while waiting for OSRM
            routeLineRef.current?.remove()
            routeLineRef.current = L.polyline(
              [userLoc, [property.latitude, property.longitude]],
              { color: C.blue, weight: 4, dashArray: '10 8', opacity: 0.6, lineCap: 'round' },
            ).addTo(map)

            // Replace with real road route once OSRM responds
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

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '300px' }}
      aria-label="Navigation map"
    />
  )
}
