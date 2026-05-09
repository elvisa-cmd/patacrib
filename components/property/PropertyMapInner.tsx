'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LMap } from 'leaflet'
import { calculateRoute } from '@/lib/utils'

export interface PropertyMapInnerProps {
  lat:        number
  lng:        number
  title:      string
  height:     string
  onNavigate?: () => void
}

const OSM_TILE        = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const C = {
  accent: '#1a6b4a',
  white:  '#ffffff',
  blue:   '#2563eb',
  blueA:  'rgba(37,99,235,0.18)',
} as const

function propertyPinHtml(title: string): string {
  const escaped = title.replace(/"/g, '&quot;').slice(0, 36)
  return `
    <div style="background:${C.accent};color:${C.white};padding:5px 12px;
      font-family:sans-serif;font-size:11px;font-weight:700;
      box-shadow:0 4px 16px rgba(26,107,74,0.35);white-space:nowrap;line-height:1.4;">
      📍 ${escaped}
    </div>
    <div style="width:0;height:0;border-left:8px solid transparent;
      border-right:8px solid transparent;
      border-top:10px solid ${C.accent};margin:0 auto;"></div>`
}

const USER_PIN_HTML = `
  <style>@keyframes pk-ring-d{
    0%{transform:translate(-50%,-50%) scale(1);opacity:0.55;}
    100%{transform:translate(-50%,-50%) scale(2.6);opacity:0;}
  }</style>
  <div style="position:relative;width:18px;height:18px;">
    <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;
      background:${C.blueA};border-radius:50%;animation:pk-ring-d 2s infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:18px;height:18px;background:${C.white};border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.28);"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:10px;height:10px;background:${C.blue};border-radius:50%;"></div>
  </div>`

export default function PropertyMapInner({
  lat,
  lng,
  title,
  height,
  onNavigate,
}: PropertyMapInnerProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<LMap | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef          = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const propMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLineRef  = useRef<any>(null)

  const [mapReady,     setMapReady]     = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    import('leaflet').then((Lmod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (Lmod as any).default ?? Lmod
      if (destroyed || !containerRef.current || mapRef.current) return

      LRef.current = L

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })
      } catch { /* ignore */ }

      const map: LMap = L.map(containerRef.current, {
        center:      [lat, lng],
        zoom:        15,
        zoomControl: false,
      })

      mapRef.current = map
      L.tileLayer(OSM_TILE, { attribution: OSM_ATTRIBUTION }).addTo(map)

      // Property pin (static — doesn't need to update)
      propMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className:  '',
          html:       propertyPinHtml(title),
          iconSize:   [180, 46],
          iconAnchor: [90, 46],
        }),
      }).addTo(map)

      setMapReady(true)
    })

    return () => {
      destroyed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      LRef.current       = null
      propMarkerRef.current = null
      userMarkerRef.current = null
      routeLineRef.current  = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── GPS: one-time position fix ─────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [])

  // ── Fit bounds + add user dot + draw route when location arrives ───────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!mapReady || !L || !map || !userLocation) return

    // Fit to show both user and property
    const bounds = L.latLngBounds([userLocation, [lat, lng]])
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })

    // User dot
    const userIcon = L.divIcon({
      className:  '',
      html:       USER_PIN_HTML,
      iconSize:   [18, 18],
      iconAnchor: [9, 9],
    })
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation).setIcon(userIcon)
    } else {
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon }).addTo(map)
    }

    // Route line
    routeLineRef.current?.remove()
    routeLineRef.current = L.polyline(
      [userLocation, [lat, lng]],
      { color: C.blue, weight: 3, dashArray: '8 8', opacity: 0.72 },
    ).addTo(map)
  }, [mapReady, userLocation, lat, lng])

  const route = userLocation ? calculateRoute(userLocation, [lat, lng]) : null

  return (
    <div>
      <div ref={containerRef} style={{ height, width: '100%', position: 'relative' }} />

      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={() => onNavigate?.()}
          className="flex items-center justify-center gap-2 bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-[0.8px] py-3 hover:bg-accent-d transition-colors"
          aria-label={`Driving directions to ${title}`}
        >
          🚗 Drive there
        </button>
        <button
          onClick={() => onNavigate?.()}
          className="flex items-center justify-center gap-2 border border-accent text-accent font-sans font-bold text-[11px] uppercase tracking-[0.8px] py-3 hover:bg-accent/10 transition-colors"
          aria-label={`Walking directions to ${title}`}
        >
          🚶 Walk there
        </button>
      </div>

      {route && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="font-sans text-[11px] text-muted">
            📍 {route.distKm} away
          </span>
          <span className="w-px h-3 bg-border2" />
          <span className="font-sans text-[11px] text-muted">
            🚶 {route.walkMin} min walk
          </span>
          <span className="w-px h-3 bg-border2" />
          <span className="font-sans text-[11px] text-muted">
            🚌 {route.matatuMin} min matatu
          </span>
        </div>
      )}
    </div>
  )
}
