'use client'

import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import { calculateRoute } from '@/lib/utils'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

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

// Green property pin with label
function getPropertyPin(title: string): L.DivIcon {
  const escaped = title.replace(/"/g, '&quot;').slice(0, 36)
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${C.accent};color:${C.white};
        padding:5px 12px;
        font-family:sans-serif;font-size:11px;font-weight:700;
        box-shadow:0 4px 16px rgba(26,107,74,0.35);
        white-space:nowrap;line-height:1.4;
      ">📍 ${escaped}</div>
      <div style="
        width:0;height:0;
        border-left:8px solid transparent;
        border-right:8px solid transparent;
        border-top:10px solid ${C.accent};
        margin:0 auto;
      "></div>`,
    iconSize:   [180, 46],
    iconAnchor: [90, 46],
  })
}

// Pulsing blue dot (same as homepage map)
const USER_PIN = L.divIcon({
  className: '',
  html: `
    <style>
      @keyframes pk-ring-d {
        0%   { transform:translate(-50%,-50%) scale(1);   opacity:0.55; }
        100% { transform:translate(-50%,-50%) scale(2.6); opacity:0; }
      }
    </style>
    <div style="position:relative;width:18px;height:18px;">
      <div style="
        position:absolute;top:50%;left:50%;
        width:36px;height:36px;
        background:${C.blueA};border-radius:50%;
        animation:pk-ring-d 2s infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:18px;height:18px;
        background:${C.white};border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,0.28);
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:10px;height:10px;
        background:${C.blue};border-radius:50%;
      "></div>
    </div>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
})

/** Fits the map bounds to show both user and property. */
function BoundsFitter({
  userLocation,
  lat,
  lng,
}: {
  userLocation: [number, number] | null
  lat: number
  lng: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!userLocation) {
      map.setView([lat, lng], 15)
      return
    }
    const bounds = L.latLngBounds([userLocation, [lat, lng]])
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
  }, [map, userLocation, lat, lng])

  return null
}

export default function PropertyMapInner({
  lat,
  lng,
  title,
  height,
  onNavigate,
}: PropertyMapInnerProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [])

  const route = userLocation
    ? calculateRoute(userLocation, [lat, lng])
    : null

  const routeLine: [number, number][] = userLocation
    ? [userLocation, [lat, lng]]
    : []

  return (
    <div>
      {/* Map */}
      <div style={{ height, width: '100%', position: 'relative' }}>
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <BoundsFitter userLocation={userLocation} lat={lat} lng={lng} />
          <TileLayer url={OSM_TILE} attribution={OSM_ATTRIBUTION} />

          {/* Route polyline */}
          {routeLine.length === 2 && (
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: C.blue,
                weight: 3,
                dashArray: '8 8',
                opacity: 0.72,
              }}
            />
          )}

          {/* Property pin */}
          <Marker position={[lat, lng]} icon={getPropertyPin(title)} />

          {/* User location */}
          {userLocation && <Marker position={userLocation} icon={USER_PIN} />}
        </MapContainer>
      </div>

      {/* Action buttons */}
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

      {/* Distance info row */}
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
