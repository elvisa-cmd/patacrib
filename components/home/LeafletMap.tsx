'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import type { SerializedProperty } from '@/types/property'
import { calculateRoute } from '@/lib/utils'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

export interface LeafletMapProps {
  properties: SerializedProperty[]
  selectedId: string | null
  onSelectProperty: (id: string) => void
  onNavigate?: (property: SerializedProperty) => void
}

const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219]

const OSM_TILE        = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Mirror of tailwind tokens — used only in imperative divIcon HTML.
const C = {
  accent:  '#1a6b4a',
  white:   '#ffffff',
  ink:     '#0f0e0c',
  border:  'rgba(15,14,12,0.13)',
  blue:    '#2563eb',
  blueA:   'rgba(37,99,235,0.18)',
} as const

const FILTER_OPTIONS = [
  { key: 'all',       label: 'All' },
  { key: 'under30k',  label: 'Under 30K' },
  { key: 'near-stage',label: 'Near stage' },
  { key: 'gps',       label: 'GPS verified' },
] as const

type FilterKey = (typeof FILTER_OPTIONS)[number]['key']

// ── Pure icon factories ────────────────────────────────────────────────────

function pricePin(price: number, selected: boolean): L.DivIcon {
  const bg    = selected ? C.accent : C.white
  const color = selected ? C.white  : C.ink
  const bdr   = selected ? C.accent : C.border
  const label = price >= 1_000_000
    ? `KSh ${(price / 1_000_000).toFixed(1)}M`
    : price >= 1_000
    ? `KSh ${Math.round(price / 1_000)}K`
    : `KSh ${price}`

  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${bg};color:${color};
        border:1.5px solid ${bdr};
        padding:4px 10px;
        font-family:sans-serif;font-size:11px;font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.14);
        transform:${selected ? 'scale(1.08)' : 'scale(1)'};
        transition:all 0.15s;
        cursor:pointer;
      ">${label}</div>
      <div style="
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:7px solid ${selected ? C.accent : C.white};
        margin:0 auto;
      "></div>`,
    iconSize:   [90, 34],
    iconAnchor: [45, 34],
  })
}

// Pulsing blue dot — same markup structure as Uber's location indicator
const USER_PIN = L.divIcon({
  className: '',
  html: `
    <style>
      @keyframes pk-ring {
        0%   { transform:translate(-50%,-50%) scale(1);   opacity:0.55; }
        100% { transform:translate(-50%,-50%) scale(2.6); opacity:0; }
      }
    </style>
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        position:absolute;top:50%;left:50%;
        width:40px;height:40px;
        background:${C.blueA};border-radius:50%;
        animation:pk-ring 2s infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:20px;height:20px;
        background:${C.white};border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,0.28);
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:12px;height:12px;
        background:${C.blue};border-radius:50%;
      "></div>
    </div>`,
  iconSize:   [20, 20],
  iconAnchor: [10, 10],
})

// ── Internal map helpers (must be children of <MapContainer>) ─────────────

function MapReady({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, [map, onReady])
  return null
}

function DragHider({ onDrag }: { onDrag: () => void }) {
  const map = useMap()
  useEffect(() => {
    map.on('dragstart', onDrag)
    return () => void map.off('dragstart', onDrag)
  }, [map, onDrag])
  return null
}

/** Fits map to both user location and selected property. */
function BoundsFitter({
  userLocation,
  property,
}: {
  userLocation: [number, number] | null
  property: SerializedProperty | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!property) return
    if (!userLocation) {
      map.flyTo([property.latitude, property.longitude], 15, { duration: 1.2 })
      return
    }
    const bounds = L.latLngBounds([
      userLocation,
      [property.latitude, property.longitude],
    ])
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
  }, [map, userLocation, property])
  return null
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LeafletMap({
  properties,
  selectedId,
  onSelectProperty,
  onNavigate,
}: LeafletMapProps) {
  const mapRef              = useRef<L.Map | null>(null)
  const [showDragHint, setShowDragHint] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationLabel, setLocationLabel] = useState('Locating you…')

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null

  // ── Client-side property filtering ────────────────────────────────────────
  const visibleProperties = useMemo(() => {
    switch (activeFilter) {
      case 'under30k':   return properties.filter((p) => p.price <= 30_000)
      case 'near-stage': return properties.filter((p) => p.matatuRoutes.length > 0)
      case 'gps':        return properties                  // all have GPS
      default:           return properties
    }
  }, [properties, activeFilter])

  // ── Route estimate (uses actual user location, not Nairobi CBD) ───────────
  const route = useMemo(() => {
    if (!selectedProperty || !userLocation) return null
    return calculateRoute(userLocation, [
      selectedProperty.latitude,
      selectedProperty.longitude,
    ])
  }, [selectedProperty, userLocation])

  // ── Drag hint auto-hide ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowDragHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // ── Real-time GPS: watchPosition (updates ~every 5–10 s) ──────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel('Location unavailable')
      setUserLocation(NAIROBI_CENTER)
      return
    }

    // Initial quick fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserLocation(loc)
        setLocationLabel('Your location')
        mapRef.current?.setView(loc, 13)
      },
      () => {
        setUserLocation(NAIROBI_CENTER)
        setLocationLabel('Nairobi CBD (default)')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )

    // Continuous watch — mirrors Uber's live location updates
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
        setLocationLabel('Your location')
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const handleMapReady = useCallback((m: L.Map) => { mapRef.current = m }, [])
  const handleDrag     = useCallback(() => setShowDragHint(false), [])

  const zoomIn    = () => mapRef.current?.zoomIn()
  const zoomOut   = () => mapRef.current?.zoomOut()
  const recenter  = () => {
    if (userLocation) mapRef.current?.flyTo(userLocation, 13)
    else mapRef.current?.flyTo(NAIROBI_CENTER, 12)
  }

  // Route line points: [userLocation, property] — only render when both exist
  const routeLine: [number, number][] =
    selectedProperty && userLocation
      ? [userLocation, [selectedProperty.latitude, selectedProperty.longitude]]
      : []

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={NAIROBI_CENTER}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapReady  onReady={handleMapReady} />
        <DragHider onDrag={handleDrag} />
        <BoundsFitter userLocation={userLocation} property={selectedProperty} />

        <TileLayer url={OSM_TILE} attribution={OSM_ATTRIBUTION} />

        {/* ── Route line: dashed blue from user to property ── */}
        {routeLine.length === 2 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: C.blue, weight: 3, dashArray: '8 8', opacity: 0.75 }}
          />
        )}

        {/* ── Property pins ── */}
        {visibleProperties.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={pricePin(p.price, p.id === selectedId)}
            eventHandlers={{ click: () => onSelectProperty(p.id) }}
          />
        ))}

        {/* ── User location (pulsing dot) ── */}
        {userLocation && <Marker position={userLocation} icon={USER_PIN} />}
      </MapContainer>

      {/* ── Overlays ── */}

      {/* Location badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-surface border border-border flex items-center gap-2 px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue animate-pulse" aria-hidden="true" />
          <span className="font-sans font-medium text-[11px] text-ink">{locationLabel}</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            aria-label={`Filter: ${label}`}
            className={`font-sans font-medium text-[10px] uppercase tracking-[0.5px] px-3 py-1.5 border transition-colors ${
              activeFilter === key
                ? 'bg-accent text-white border-accent'
                : 'bg-surface text-muted border-border hover:border-border2 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Zoom / recenter controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1">
        {[
          { icon: '+', label: 'Zoom in',      action: zoomIn },
          { icon: '−', label: 'Zoom out',     action: zoomOut },
          { icon: '◎', label: 'Recenter map', action: recenter },
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

      {/* Route card */}
      <div className="absolute bottom-3 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1000] md:min-w-[340px] md:max-w-[420px]">
        <div className="bg-surface border border-border shadow-lg px-4 py-3">
          {selectedProperty && route ? (
            <div className="flex items-center gap-3">
              {/* Property title + address */}
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-[13px] text-ink truncate leading-snug">
                  {selectedProperty.title}
                </p>
                <p className="font-sans text-[11px] text-muted truncate mt-0.5">
                  {selectedProperty.address}
                </p>
              </div>

              {/* Distance stats */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-center">
                  <p className="font-sans font-black text-[13px] text-ink leading-none">
                    {route.distKm}
                  </p>
                  <p className="font-sans text-[8px] uppercase tracking-[0.8px] text-muted mt-0.5">
                    Away
                  </p>
                </div>
                <div className="w-px h-6 bg-border2" />
                <div className="text-center">
                  <p className="font-sans font-black text-[13px] text-ink leading-none">
                    {route.walkMin}m
                  </p>
                  <p className="font-sans text-[8px] uppercase tracking-[0.8px] text-muted mt-0.5">
                    Walk
                  </p>
                </div>
                <div className="w-px h-6 bg-border2" />
                <div className="text-center">
                  <p className="font-sans font-black text-[13px] text-ink leading-none">
                    {route.matatuMin}m
                  </p>
                  <p className="font-sans text-[8px] uppercase tracking-[0.8px] text-muted mt-0.5">
                    Matatu
                  </p>
                </div>
              </div>

              {/* Directions CTA */}
              <button
                onClick={() => onNavigate?.(selectedProperty)}
                className="flex-shrink-0 bg-accent text-white font-sans font-bold text-[10px] uppercase tracking-[0.8px] px-3 py-2.5 hover:bg-accent-d transition-colors"
                aria-label={`Get driving directions to ${selectedProperty.title}`}
              >
                <span className="hidden md:inline">Directions</span>
                <span className="md:hidden">🗺</span>
              </button>
            </div>
          ) : (
            <p className="font-sans text-[12px] text-muted text-center py-0.5">
              Tap a pin to see route details
            </p>
          )}
        </div>
      </div>

      {/* Drag hint */}
      {showDragHint && (
        <div className="absolute bottom-3 right-3 z-[1000] font-sans text-[11px] text-muted bg-surface border border-border px-3 py-1.5 shadow-sm pointer-events-none">
          ✋ Drag to explore
        </div>
      )}
    </div>
  )
}
