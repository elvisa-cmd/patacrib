'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import type { SerializedProperty } from '@/types/property'

// Prevents webpack from failing to resolve leaflet's default icon asset paths.
// We use only custom divIcon markers so default icons are never rendered.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

export interface LeafletMapProps {
  properties: SerializedProperty[]
  selectedId: string | null
  onSelectProperty: (id: string) => void
}

const NAIROBI_LAT = -1.2921
const NAIROBI_LNG = 36.8219
const NAIROBI_CENTER = [NAIROBI_LAT, NAIROBI_LNG] as [number, number]

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const FILTERS = ['All', 'Under 30K', 'Near stage', 'GPS verified']

// Mirror of tailwind.config.ts tokens — used only in imperative Leaflet
// divIcon HTML, which cannot receive Tailwind classes.
const COLORS = {
  accent:  '#1a6b4a',
  surface: '#ffffff',
  ink:     '#0f0e0c',
  border2: 'rgba(15,14,12,0.13)',
  blue:    '#2563eb',
} as const

// ── Pure utility functions ─────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) return `KSh ${Math.round(price / 1000)}K`
  return `KSh ${price}`
}

function distanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getPriceIcon(price: number, isSelected: boolean): L.DivIcon {
  const bg    = isSelected ? COLORS.accent  : COLORS.surface
  const color = isSelected ? COLORS.surface : COLORS.ink
  const bdr   = isSelected ? COLORS.accent  : COLORS.border2
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:${color};padding:3px 8px;font-family:'Cabinet Grotesk',sans-serif;font-size:11px;font-weight:600;border:1px solid ${bdr};box-shadow:0 2px 8px rgba(0,0,0,0.12);white-space:nowrap;cursor:pointer;line-height:1.4;">${formatPrice(price)}</div>`,
    iconAnchor: [0, 14],
  })
}

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${COLORS.blue};border:2px solid ${COLORS.surface};animation:pulse-blue 2s infinite;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// ── Internal helper components (must be children of MapContainer) ──────────

function MapController({
  onReady,
}: {
  onReady: (map: L.Map) => void
}) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

function DragListener({ onDrag }: { onDrag: () => void }) {
  const map = useMap()
  useEffect(() => {
    map.on('dragstart', onDrag)
    return () => void map.off('dragstart', onDrag)
  }, [map, onDrag])
  return null
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LeafletMap({
  properties,
  selectedId,
  onSelectProperty,
}: LeafletMapProps) {
  const mapRef             = useRef<L.Map | null>(null)
  const [showDragHint, setShowDragHint]   = useState(true)
  const [activeFilter, setActiveFilter]   = useState('All')
  const [userLocation, setUserLocation]   = useState<[number, number] | null>(null)
  const [geoError, setGeoError]           = useState<string | null>(null)

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null

  const routeEstimate = selectedProperty
    ? (() => {
        const km = distanceKm(
          NAIROBI_LAT, NAIROBI_LNG,
          selectedProperty.latitude,
          selectedProperty.longitude,
        )
        return {
          km:         km.toFixed(1),
          walkMin:    Math.max(1, Math.round((km / 4) * 60)),
          matatuMin:  Math.max(3, Math.round((km / 25) * 60)),
        }
      })()
    : null

  useEffect(() => {
    const timer = setTimeout(() => setShowDragHint(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setGeoError('Location access denied'),
    )
  }, [])

  useEffect(() => {
    if (!mapRef.current || !selectedId) return
    const property = properties.find((p) => p.id === selectedId)
    if (!property) return
    mapRef.current.flyTo([property.latitude, property.longitude], 15, {
      duration: 1.2,
    })
  }, [selectedId, properties])

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
  }, [])

  const handleZoomIn   = () => mapRef.current?.zoomIn()
  const handleZoomOut  = () => mapRef.current?.zoomOut()
  const handleRecenter = () => mapRef.current?.flyTo(NAIROBI_CENTER, 12)

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={NAIROBI_CENTER}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController onReady={handleMapReady} />
        <DragListener onDrag={() => setShowDragHint(false)} />

        <TileLayer url={OSM_TILE} attribution={OSM_ATTRIBUTION} />

        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude, property.longitude]}
            icon={getPriceIcon(property.price, selectedId === property.id)}
            eventHandlers={{ click: () => onSelectProperty(property.id) }}
          />
        ))}

        {userLocation && <Marker position={userLocation} icon={USER_ICON} />}
      </MapContainer>

      {/* ── Overlays (z-[1000] clears all Leaflet pane z-indices) ── */}

      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-surface border border-border flex items-center gap-2 px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue animate-pulse" aria-hidden="true" />
          <span className="font-sans font-medium text-[11px] text-ink">
            {geoError ?? 'Your location · Nairobi CBD'}
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            aria-label={`Filter: ${f}`}
            className={`font-sans font-medium text-[10px] uppercase tracking-[0.5px] px-3 py-1.5 border transition-colors ${
              activeFilter === f
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-muted border-border hover:border-border2 hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1">
        {[
          { icon: '+', label: 'Zoom in',      action: handleZoomIn },
          { icon: '−', label: 'Zoom out',     action: handleZoomOut },
          { icon: '◎', label: 'Recenter map', action: handleRecenter },
        ].map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            aria-label={label}
            className="w-8 h-8 bg-surface border border-border flex items-center justify-center font-sans text-[14px] text-muted hover:text-ink hover:border-border2 transition-colors shadow-sm"
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] min-w-[280px]">
        <div className="bg-surface border border-border shadow-lg px-5 py-3">
          {selectedProperty && routeEstimate ? (
            <>
              <p className="font-sans font-bold text-[13px] text-ink truncate">
                {selectedProperty.title}
              </p>
              <p className="font-sans text-[11px] text-muted mt-0.5">
                {selectedProperty.address}
              </p>
              <div className="flex items-center gap-4 mt-2 mb-2.5">
                <span className="font-sans text-[10px] text-muted">
                  {routeEstimate.km} km · Walk ~{routeEstimate.walkMin} min
                </span>
                <span className="font-sans text-[10px] text-muted">
                  Matatu ~{routeEstimate.matatuMin} min
                </span>
              </div>
              <a
                href={`/property/${selectedProperty.id}`}
                aria-label={`Get directions to ${selectedProperty.title}`}
                className="block text-center bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-[0.8px] py-2 hover:bg-accent-d transition-colors"
              >
                Get Directions →
              </a>
            </>
          ) : (
            <p className="font-sans text-[12px] text-muted text-center py-1">
              Click a pin to see route details
            </p>
          )}
        </div>
      </div>

      {showDragHint && (
        <div className="absolute bottom-3 right-3 z-[1000] font-sans text-[11px] text-muted bg-surface border border-border px-3 py-1.5 shadow-sm">
          ✋ Drag to explore
        </div>
      )}
    </div>
  )
}
