'use client'

import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'

// Prevents webpack from failing to resolve leaflet's default icon asset paths.
// Only custom divIcon markers are used here.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

export interface PropertyMapInnerProps {
  lat:    number
  lng:    number
  title:  string
  height: string
}

const OSM_TILE        = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Mirror of tailwind.config.ts tokens — only used in imperative divIcon HTML.
const COLORS = {
  accent:  '#1a6b4a',
  surface: '#ffffff',
  blue:    '#2563eb',
} as const

function getPinIcon(title: string): L.DivIcon {
  const escaped = title.replace(/"/g, '&quot;').slice(0, 40)
  return L.divIcon({
    className: '',
    html: `<div style="background:${COLORS.accent};color:${COLORS.surface};padding:4px 10px;font-family:'Cabinet Grotesk',sans-serif;font-size:11px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.15);white-space:nowrap;line-height:1.4;">${escaped}</div>`,
    iconAnchor: [0, 14],
  })
}

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:${COLORS.blue};border:2px solid ${COLORS.surface};animation:pulse-blue 2s infinite;"></div>`,
  iconSize:   [12, 12],
  iconAnchor: [6, 6],
})

function SetView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 15) }, [map, lat, lng])
  return null
}

export default function PropertyMapInner({
  lat,
  lng,
  title,
  height,
}: PropertyMapInnerProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation([pos.coords.latitude, pos.coords.longitude])
    })
  }, [])

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      zoomControl={false}
      style={{ height, width: '100%' }}
    >
      <SetView lat={lat} lng={lng} />
      <TileLayer url={OSM_TILE} attribution={OSM_ATTRIBUTION} />
      <Marker
        position={[lat, lng]}
        icon={getPinIcon(title)}
      />
      {userLocation && (
        <Marker position={userLocation} icon={USER_ICON} />
      )}
    </MapContainer>
  )
}
