'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

const ACCENT = '#1a6b4a'
const WHITE  = '#ffffff'

const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:${ACCENT};border:3px solid ${WHITE};box-shadow:0 2px 10px rgba(0,0,0,0.35);"></div>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
})

function SetView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 })
  }, [map, lat, lng])
  return null
}

export default function LocationPreviewMapInner({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={17}
      zoomControl={false}
      style={{ height: '200px', width: '100%' }}
    >
      <SetView lat={lat} lng={lng} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lng]} icon={PIN_ICON} />
    </MapContainer>
  )
}
