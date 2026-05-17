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
  property:     NavProperty
  userLocation: { lat: number; lng: number } | null
  onRouteReady: (route: NavRoute) => void
  travelMode:   'walking' | 'driving' | 'matatu'
}

const C = {
  accent: '#1a6b4a',
  blue:   '#2563eb',
  blueA:  'rgba(37,99,235,0.15)',
  white:  '#ffffff',
} as const

function buildUserIcon(L: typeof import('leaflet')) {
  return L.divIcon({
    className: '',
    html: `
      <style>@keyframes navPulse{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}</style>
      <div style="position:relative;width:28px;height:28px;">
        <div style="position:absolute;top:50%;left:50%;width:56px;height:56px;background:${C.blueA};border-radius:50%;animation:navPulse 2s infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;background:${C.white};border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,0.3);"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;background:${C.blue};border-radius:50%;"></div>
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
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function NavigationMapInner({
  property,
  userLocation,
  onRouteReady,
  travelMode,
}: NavigationMapInnerProps) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInstRef      = useRef<import('leaflet').Map | null>(null)
  const leafletRef      = useRef<typeof import('leaflet') | null>(null)
  const userMarkerRef   = useRef<import('leaflet').Marker | null>(null)
  const routeLineRef    = useRef<import('leaflet').Layer | null>(null)
  const cancelRouteRef  = useRef(false)
  const userLocRef      = useRef(userLocation)
  const onRouteReadyRef = useRef(onRouteReady)

  userLocRef.current      = userLocation
  onRouteReadyRef.current = onRouteReady

  // ── Map init (runs once) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstRef.current) return
    let mapCancelled = false

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (mapCancelled || !mapRef.current) return

      leafletRef.current = L

      const map = L.map(mapRef.current, {
        zoomControl:        false,
        attributionControl: false,
        dragging:           true,
        touchZoom:          true,
        // fix iOS Safari tap delay — cast because @types/leaflet omits these options
        ...({ tap: false, tapTolerance: 15 } as object),
      } as import('leaflet').MapOptions)
      mapInstRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      const escaped  = property.title.replace(/"/g, '&quot;').slice(0, 32)
      const propIcon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="background:${C.accent};color:${C.white};padding:6px 14px;font-weight:900;font-size:13px;font-family:sans-serif;box-shadow:0 4px 20px rgba(26,107,74,0.5);white-space:nowrap;border-radius:2px;">🏠 ${escaped}</div>
            <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${C.accent};"></div>
            <div style="width:8px;height:8px;background:${C.accent};border-radius:50%;margin-top:-2px;"></div>
          </div>`,
        iconSize:   [200, 56],
        iconAnchor: [100, 56],
      })
      L.marker([property.latitude, property.longitude], { icon: propIcon }).addTo(map)
      map.setView([property.latitude, property.longitude], 15)

      // If userLocation was already set before map finished initializing
      if (userLocRef.current && !mapCancelled) {
        void drawRoute(L, map, userLocRef.current)
      }
    }

    init()

    return () => {
      mapCancelled = true
      mapInstRef.current?.remove()
      mapInstRef.current = null
      leafletRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Redraw whenever userLocation changes ──────────────────────────────────
  useEffect(() => {
    const L   = leafletRef.current
    const map = mapInstRef.current
    if (!L || !map) return   // map not ready yet — init() handles the initial draw

    cancelRouteRef.current = true
    userMarkerRef.current?.remove()
    userMarkerRef.current = null
    routeLineRef.current?.remove()
    routeLineRef.current = null

    if (!userLocation) {
      map.setView([property.latitude, property.longitude], 15)
      return
    }

    cancelRouteRef.current = false
    void drawRoute(L, map, userLocation)

    return () => { cancelRouteRef.current = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, travelMode])

  async function drawRoute(
    L:   typeof import('leaflet'),
    map: import('leaflet').Map,
    loc: { lat: number; lng: number },
  ) {
    const { lat, lng } = loc

    userMarkerRef.current?.remove()
    userMarkerRef.current = L.marker([lat, lng], { icon: buildUserIcon(L), zIndexOffset: 1000 }).addTo(map)
    map.fitBounds(L.latLngBounds([[lat, lng], [property.latitude, property.longitude]]), { padding: [80, 80] })

    const distMetres = haversineM(lat, lng, property.latitude, property.longitude)
    const roadM      = distMetres * 1.4

    onRouteReadyRef.current({
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
    if (!result || cancelRouteRef.current) return

    routeLineRef.current?.remove()
    const geoLayer = L.geoJSON(
      result.geometry as Parameters<typeof L.geoJSON>[0],
      { style: { color: C.accent, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' } },
    ).addTo(map)
    routeLineRef.current = geoLayer
    const bounds = geoLayer.getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] })

    onRouteReadyRef.current({
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

  return (
    <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
      <div ref={mapRef} className="w-full h-full" aria-label="Navigation map" />
    </div>
  )
}
