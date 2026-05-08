'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { calculateRoute } from '@/lib/utils'
import type { RouteEstimate, DirectionStep } from '@/lib/utils'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

export interface NavigationMapInnerProps {
  lat:                number
  lng:                number
  title:              string
  address:            string
  onRouteCalculated:  (route: RouteEstimate) => void
  onDirectionsReady:  (steps: DirectionStep[]) => void
}

// Mirror of tailwind tokens — only used in imperative divIcon HTML.
const C = {
  accent: '#1a6b4a',
  white:  '#ffffff',
  blue:   '#2563eb',
  blueA:  'rgba(37,99,235,0.18)',
} as const

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Generates simplified walking directions from two GPS coordinates. */
function generateDirections(
  fromLat: number,
  fromLng: number,
  toLat:   number,
  toLng:   number,
  address: string,
): DirectionStep[] {
  const latDiff    = toLat - fromLat
  const lngDiff    = toLng - fromLng
  const northSouth = latDiff > 0 ? 'north' : 'south'
  const eastWest   = lngDiff > 0 ? 'east'  : 'west'
  const distM      = Math.round(Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111 * 1000)
  const street     = address.split(',')[0] ?? address

  return [
    {
      instruction: `Head ${northSouth} from your location`,
      distance:    `${Math.round(distM * 0.3)}m`,
      arrow:        northSouth === 'north' ? '↑' : '↓',
    },
    {
      instruction: `Turn ${eastWest} and continue`,
      distance:    `${Math.round(distM * 0.4)}m`,
      arrow:        eastWest === 'east' ? '→' : '←',
    },
    {
      instruction: `Continue straight toward ${street}`,
      distance:    `${Math.round(distM * 0.3)}m`,
      arrow:        '↑',
    },
  ]
}

export default function NavigationMapInner({
  lat,
  lng,
  title,
  address,
  onRouteCalculated,
  onDirectionsReady,
}: NavigationMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl:        true,
      attributionControl: false,
    })

    L.tileLayer(OSM_TILE).addTo(map)

    // Property green pin — always shown immediately
    const escaped  = title.replace(/"/g, '&quot;').slice(0, 36)
    const propIcon = L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="background:${C.accent};color:${C.white};padding:5px 12px;
            font-family:sans-serif;font-size:11px;font-weight:700;
            box-shadow:0 4px 16px rgba(26,107,74,0.35);white-space:nowrap;">
            📍 ${escaped}
          </div>
          <div style="width:0;height:0;border-left:8px solid transparent;
            border-right:8px solid transparent;border-top:10px solid ${C.accent};"></div>
        </div>`,
      iconSize:   [180, 46],
      iconAnchor: [90, 46],
    })

    L.marker([lat, lng], { icon: propIcon }).addTo(map)
    map.setView([lat, lng], 15)

    // User location (async — non-blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude
          const uLng = pos.coords.longitude

          const userIcon = L.divIcon({
            className: '',
            html: `
              <style>@keyframes nav-ring{0%{transform:translate(-50%,-50%) scale(1);opacity:0.55}
              100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}</style>
              <div style="position:relative;width:20px;height:20px;">
                <div style="position:absolute;top:50%;left:50%;
                  width:40px;height:40px;background:${C.blueA};border-radius:50%;
                  animation:nav-ring 2s infinite;"></div>
                <div style="position:absolute;top:50%;left:50%;
                  transform:translate(-50%,-50%);width:20px;height:20px;
                  background:${C.white};border-radius:50%;
                  box-shadow:0 2px 8px rgba(0,0,0,0.28);"></div>
                <div style="position:absolute;top:50%;left:50%;
                  transform:translate(-50%,-50%);width:12px;height:12px;
                  background:${C.blue};border-radius:50%;"></div>
              </div>`,
            iconSize:   [20, 20],
            iconAnchor: [10, 10],
          })

          L.marker([uLat, uLng], { icon: userIcon }).addTo(map)

          // Dashed route polyline
          L.polyline(
            [[uLat, uLng], [lat, lng]],
            { color: C.blue, weight: 4, dashArray: '10 8', opacity: 0.8 },
          ).addTo(map)

          // Fit both points into view
          map.fitBounds(
            L.latLngBounds([[uLat, uLng], [lat, lng]]),
            { padding: [80, 80] },
          )

          onRouteCalculated(calculateRoute([uLat, uLng], [lat, lng]))
          onDirectionsReady(generateDirections(uLat, uLng, lat, lng, address))
        },
        () => {
          // Permission denied — stay centered on property, no route shown
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      )
    }

    return () => { map.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, title, address])

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%' }}
      aria-label="Navigation map"
    />
  )
}
