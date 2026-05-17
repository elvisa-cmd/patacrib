'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Map as LMap } from 'leaflet'
import type { SerializedProperty } from '@/types/property'
import { calculateRoute } from '@/lib/utils'
import PhotoLocationCapture from '@/components/shared/PhotoLocationCapture'

export interface LeafletMapProps {
  properties:       SerializedProperty[]
  selectedId:       string | null
  onSelectProperty: (id: string) => void
  onNavigate?:      (property: SerializedProperty) => void
}

const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219]
const OSM_TILE        = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const C = {
  accent: '#1a6b4a',
  white:  '#ffffff',
  ink:    '#0f0e0c',
  border: 'rgba(15,14,12,0.13)',
  blue:   '#2563eb',
  blueA:  'rgba(37,99,235,0.18)',
} as const

const FILTER_OPTIONS = [
  { key: 'all',        label: 'All' },
  { key: 'under30k',   label: 'Under 30K' },
  { key: 'near-stage', label: 'Near stage' },
  { key: 'gps',        label: 'GPS verified' },
] as const

type FilterKey = (typeof FILTER_OPTIONS)[number]['key']

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pricePinHtml(price: number, selected: boolean, estate?: string | null): string {
  const bg     = selected ? C.accent : C.white
  const color  = selected ? C.white  : C.ink
  const bdr    = selected ? C.accent : C.border
  const nameFg = selected ? 'rgba(255,255,255,0.75)' : '#87837c'
  const label  =
    price >= 1_000_000 ? `KSh ${(price / 1_000_000).toFixed(1)}M` :
    price >= 1_000     ? `KSh ${Math.round(price / 1_000)}K` :
                         `KSh ${price}`
  const nameRow = estate
    ? `<div style="font-size:9px;font-weight:600;color:${nameFg};margin-bottom:2px;
         max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
         ${escHtml(estate.slice(0, 18))}
       </div>`
    : ''
  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="background:${bg};color:${color};border:1.5px solid ${bdr};padding:5px 11px 4px;
        font-family:sans-serif;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.14);border-radius:8px;text-align:center;
        transform:${selected ? 'scale(1.08)' : 'scale(1)'};transition:all 0.15s;">
        ${nameRow}
        <div style="font-size:11px;font-weight:700;">${label}</div>
      </div>
      <div style="width:0;height:0;
        border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:7px solid ${selected ? C.accent : C.white};margin:0 auto;"></div>
    </div>`
}

const USER_PIN_HTML = `
  <style>@keyframes pk-ring{
    0%{transform:translate(-50%,-50%) scale(1);opacity:0.55;}
    100%{transform:translate(-50%,-50%) scale(2.6);opacity:0;}
  }</style>
  <div style="position:relative;width:20px;height:20px;">
    <div style="position:absolute;top:50%;left:50%;width:40px;height:40px;
      background:${C.blueA};border-radius:50%;animation:pk-ring 2s infinite;"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:20px;height:20px;background:${C.white};border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.28);"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:12px;height:12px;background:${C.blue};border-radius:50%;"></div>
  </div>`

export default function LeafletMap({
  properties,
  selectedId,
  onSelectProperty,
  onNavigate,
}: LeafletMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<LMap | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef          = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef    = useRef<Map<string, any>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLineRef  = useRef<any>(null)
  const onSelectRef   = useRef(onSelectProperty)

  const [mapReady,      setMapReady]      = useState(false)
  const [showDragHint,  setShowDragHint]  = useState(true)
  const [activeFilter,  setActiveFilter]  = useState<FilterKey>('all')
  const [userLocation,  setUserLocation]  = useState<[number, number] | null>(null)
  const [locationLabel, setLocationLabel] = useState('Locating you…')
  const [gpsDenied,     setGpsDenied]     = useState(false)

  // Keep callback ref current without re-running marker effects
  useEffect(() => { onSelectRef.current = onSelectProperty }, [onSelectProperty])

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null

  const visibleProperties = useMemo(() => {
    switch (activeFilter) {
      case 'under30k':   return properties.filter((p) => p.price <= 30_000)
      case 'near-stage': return properties.filter((p) => p.matatuRoutes.length > 0)
      default:           return properties
    }
  }, [properties, activeFilter])

  const route = useMemo(() => {
    if (!selectedProperty || !userLocation) return null
    return calculateRoute(userLocation, [
      selectedProperty.latitude,
      selectedProperty.longitude,
    ])
  }, [selectedProperty, userLocation])

  // ── Init map (once on mount) ───────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    import('leaflet').then((Lmod) => {
      // Handle both ESM default and CJS module shapes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (Lmod as any).default ?? Lmod
      if (destroyed || !containerRef.current || mapRef.current) return

      LRef.current = L

      // Fix webpack-mangled default icon URLs (we use divIcons only, but needed for safety)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })
      } catch { /* ignore */ }

      const map: LMap = L.map(containerRef.current, {
        center:      NAIROBI_CENTER,
        zoom:        12,
        zoomControl: false,
      })

      mapRef.current = map
      L.tileLayer(OSM_TILE, { attribution: OSM_ATTRIBUTION }).addTo(map)
      map.on('dragstart', () => setShowDragHint(false))
      setMapReady(true)
    })

    return () => {
      destroyed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      LRef.current = null
      markersRef.current.clear()
      userMarkerRef.current = null
      routeLineRef.current  = null
    }
  }, [])

  // ── Drag hint auto-hide ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowDragHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // ── GPS: get + watch position ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel('Location unavailable')
      setUserLocation(NAIROBI_CENTER)
      return
    }

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
        setGpsDenied(true)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )

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

  // ── Update property price-pin markers ─────────────────────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!mapReady || !L || !map) return

    const visibleIds = new Set(visibleProperties.map((p) => p.id))

    // Remove markers for properties no longer visible
    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })

    // Add new / update existing markers
    visibleProperties.forEach((p) => {
      const icon = L.divIcon({
        className:  '',
        html:       pricePinHtml(p.price, p.id === selectedId, p.estate),
        iconSize:   [120, 50],
        iconAnchor: [60, 50],
      })

      if (markersRef.current.has(p.id)) {
        markersRef.current.get(p.id).setIcon(icon)
      } else {
        const marker = L.marker([p.latitude, p.longitude], { icon })
          .addTo(map)
          .on('click', () => {
            window.location.href = `/property/${p.id}`
          })
        markersRef.current.set(p.id, marker)
      }
    })
  }, [mapReady, visibleProperties, selectedId])

  // ── Update user location dot ───────────────────────────────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!mapReady || !L || !map || !userLocation) return

    const icon = L.divIcon({
      className:  '',
      html:       USER_PIN_HTML,
      iconSize:   [20, 20],
      iconAnchor: [10, 10],
    })

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation).setIcon(icon)
    } else {
      userMarkerRef.current = L.marker(userLocation, { icon }).addTo(map)
    }
  }, [mapReady, userLocation])

  // ── Update route polyline ──────────────────────────────────────────────────
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!mapReady || !L || !map) return

    routeLineRef.current?.remove()
    routeLineRef.current = null

    if (selectedProperty && userLocation) {
      routeLineRef.current = L.polyline(
        [userLocation, [selectedProperty.latitude, selectedProperty.longitude]],
        { color: C.blue, weight: 3, dashArray: '8 8', opacity: 0.75 },
      ).addTo(map)
    }
  }, [mapReady, selectedProperty, userLocation])

  // ── Fly / fit bounds when selected property changes ────────────────────────
  const prevSelectedIdRef = useRef<string | null>(null)
  useEffect(() => {
    const L   = LRef.current
    const map = mapRef.current
    if (!mapReady || !L || !map || !selectedProperty) return
    if (prevSelectedIdRef.current === selectedProperty.id) return
    prevSelectedIdRef.current = selectedProperty.id

    if (!userLocation) {
      map.flyTo([selectedProperty.latitude, selectedProperty.longitude], 15, { duration: 1.2 })
    } else {
      const bounds = L.latLngBounds([
        userLocation,
        [selectedProperty.latitude, selectedProperty.longitude],
      ])
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    }
  }, [mapReady, selectedProperty, userLocation])

  const zoomIn   = () => mapRef.current?.zoomIn()
  const zoomOut  = () => mapRef.current?.zoomOut()
  const recenter = () => {
    if (userLocation) mapRef.current?.flyTo(userLocation, 13)
    else mapRef.current?.flyTo(NAIROBI_CENTER, 12)
  }

  return (
    <div className="absolute inset-0">
      {/* Imperative Leaflet mount target */}
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* ── Location badge ── */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="bg-surface border border-border flex items-center gap-2 px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
          <span className="font-sans font-medium text-[11px] text-ink">{locationLabel}</span>
        </div>
      </div>

      {/* ── Photo location fallback (when GPS denied) ── */}
      {gpsDenied && (
        <div className="absolute top-10 left-3 z-[1000]" style={{ maxWidth: '280px' }}>
          <PhotoLocationCapture
            onLocationFound={(lat, lng, address) => {
              setUserLocation([lat, lng])
              setLocationLabel(address || 'My current location')
              setGpsDenied(false)
              mapRef.current?.flyTo([lat, lng], 14)
            }}
            onFail={() => {}}
          />
        </div>
      )}

      {/* ── Filter chips ── */}
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

      {/* ── Zoom / recenter controls ── */}
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

      {/* ── Route card ── */}
      <div className="absolute bottom-3 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1000] md:min-w-[340px] md:max-w-[420px]">
        <div className="bg-surface border border-border shadow-lg px-4 py-3">
          {selectedProperty && route ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-[13px] text-ink truncate leading-snug">
                  {selectedProperty.title}
                </p>
                <p className="font-sans text-[11px] text-muted truncate mt-0.5">
                  {selectedProperty.address}
                </p>
              </div>

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

              <a
                href={`/property/${selectedProperty.id}`}
                className="flex-shrink-0 bg-surface border border-border2 text-ink font-sans font-bold text-[10px] uppercase tracking-[0.8px] px-3 py-2.5 hover:bg-surface2 transition-colors"
                aria-label={`View ${selectedProperty.title}`}
              >
                View
              </a>
              <button
                onClick={() => onNavigate?.(selectedProperty)}
                className="flex-shrink-0 bg-accent text-white font-sans font-bold text-[10px] uppercase tracking-[0.8px] px-3 py-2.5 hover:bg-accent-d transition-colors"
                aria-label={`Get directions to ${selectedProperty.title}`}
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

      {/* ── Drag hint ── */}
      {showDragHint && (
        <div className="absolute bottom-3 right-3 z-[1000] font-sans text-[11px] text-muted bg-surface border border-border px-3 py-1.5 shadow-sm pointer-events-none">
          ✋ Drag to explore
        </div>
      )}
    </div>
  )
}
