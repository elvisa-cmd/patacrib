'use client'

import { useEffect, useRef } from 'react'

interface Property {
  id:          string
  title:       string
  price:       number
  latitude:    number
  longitude:   number
  address:     string
  estate:      string | null
  propertyType?: string
}

interface Props {
  properties:       Property[]
  selectedId:       string | null
  onSelectProperty: (id: string) => void
}

const DEFAULT_LAT = -1.286389
const DEFAULT_LNG = 36.817223

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function pinHtml(prop: Property, selected: boolean): string {
  const priceLabel =
    prop.price >= 1_000_000
      ? `${(prop.price / 1_000_000).toFixed(1)}M`
      : prop.price >= 1_000
      ? `${Math.round(prop.price / 1_000)}K`
      : String(prop.price)

  const name = esc((prop.estate || prop.title).slice(0, 18))

  const bg       = selected ? '#1a6b4a' : '#ffffff'
  const fg       = selected ? '#ffffff' : '#0f0e0c'
  const nameFg   = selected ? 'rgba(255,255,255,0.75)' : '#87837c'
  const border   = selected ? '#1a6b4a' : 'rgba(0,0,0,0.18)'
  const tipColor = selected ? '#1a6b4a' : '#ffffff'

  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="
        background:${bg};color:${fg};
        border:2px solid ${border};
        padding:5px 11px 4px;
        font-family:sans-serif;
        white-space:nowrap;
        box-shadow:0 3px 10px rgba(0,0,0,0.18);
        border-radius:8px;
        text-align:center;
        transform:${selected ? 'scale(1.08)' : 'scale(1)'};
        transition:transform 0.12s;
      ">
        <div style="font-size:9px;font-weight:600;color:${nameFg};margin-bottom:1px;
          max-width:110px;overflow:hidden;text-overflow:ellipsis;">
          ${name}
        </div>
        <div style="font-size:12px;font-weight:800;">KSh ${priceLabel}</div>
      </div>
      <div style="width:0;height:0;
        border-left:6px solid transparent;border-right:6px solid transparent;
        border-top:8px solid ${tipColor};margin-top:-1px;"></div>
      <div style="width:5px;height:5px;background:${selected ? '#1a6b4a' : '#87837c'};
        border-radius:50%;margin-top:-1px;"></div>
    </div>`
}

export default function BrowseMapInner({
  properties,
  selectedId,
  onSelectProperty,
}: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const markersRef     = useRef<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center:             [DEFAULT_LAT, DEFAULT_LNG],
        zoom:               12,
        zoomControl:        true,
        attributionControl: false,
      })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Show user location dot
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userIcon = L.divIcon({
              html: `
                <style>@keyframes bmPulse{
                  0%{transform:translate(-50%,-50%) scale(1);opacity:0.6}
                  100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}
                }</style>
                <div style="position:relative;width:20px;height:20px;">
                  <div style="position:absolute;top:50%;left:50%;
                    width:40px;height:40px;background:rgba(37,99,235,0.2);
                    border-radius:50%;animation:bmPulse 2s infinite;"></div>
                  <div style="position:absolute;top:50%;left:50%;
                    transform:translate(-50%,-50%);width:18px;height:18px;
                    background:white;border-radius:50%;
                    box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
                  <div style="position:absolute;top:50%;left:50%;
                    transform:translate(-50%,-50%);width:12px;height:12px;
                    background:#2563eb;border-radius:50%;"></div>
                </div>`,
              className:   '',
              iconSize:    [20, 20],
              iconAnchor:  [10, 10],
            })
            L.marker(
              [pos.coords.latitude, pos.coords.longitude],
              { icon: userIcon, zIndexOffset: 1000 },
            ).addTo(map)
          },
          () => {},
          { enableHighAccuracy: true },
        )
      }
    }

    init()

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markersRef.current = []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild markers whenever properties or selectedId changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const addMarkers = async () => {
      const L = (await import('leaflet')).default

      // Clear existing markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      // Only show GPS-verified properties (not sitting on the CBD default)
      const mappable = properties.filter(
        p => p.latitude !== DEFAULT_LAT || p.longitude !== DEFAULT_LNG
      )

      mappable.forEach((prop) => {
        const isSelected = prop.id === selectedId

        const icon = L.divIcon({
          html:       pinHtml(prop, isSelected),
          className:  '',
          iconSize:   [120, 52],
          iconAnchor: [60, 52],
        })

        const marker = L.marker([prop.latitude, prop.longitude], { icon }).addTo(map)

        // Always navigate directly to property on click
        marker.on('click', () => {
          window.location.href = `/property/${prop.id}`
        })

        markersRef.current.push(marker)
      })

      // Fit bounds to GPS-verified pins, or fall back to Nairobi center
      if (mappable.length > 0) {
        const bounds = L.latLngBounds(mappable.map(p => [p.latitude, p.longitude]))
        map.fitBounds(bounds, { padding: [60, 60] })
      } else {
        map.setView([DEFAULT_LAT, DEFAULT_LNG], 12)
      }
    }

    addMarkers()
  }, [properties, selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  )
}
