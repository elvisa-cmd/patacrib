'use client'

import { useEffect, useRef } from 'react'

interface Property {
  id:        string
  title:     string
  price:     number
  latitude:  number
  longitude: number
  address:   string
  estate:    string | null
}

interface Props {
  properties:       Property[]
  selectedId:       string | null
  onSelectProperty: (id: string) => void
}

export default function BrowseMapInner({
  properties,
  selectedId,
  onSelectProperty,
}: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const markersRef     = useRef<Map<string, any>>(new Map()) // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center:             [-1.2921, 36.8219],
        zoom:               12,
        zoomControl:        true,
        attributionControl: false,
      })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Add price-pin markers for every property
      properties.forEach((prop) => {
        const isSelected = prop.id === selectedId
        const label =
          prop.price >= 1_000_000
            ? `${(prop.price / 1_000_000).toFixed(1)}M`
            : prop.price >= 1_000
            ? `${Math.round(prop.price / 1_000)}K`
            : String(prop.price)

        const icon = L.divIcon({
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="
                background:${isSelected ? '#1a6b4a' : 'white'};
                color:${isSelected ? 'white' : '#0f0e0c'};
                border:2px solid ${isSelected ? '#1a6b4a' : 'rgba(0,0,0,0.2)'};
                padding:4px 10px;
                font-family:sans-serif;font-size:12px;font-weight:800;
                white-space:nowrap;
                box-shadow:0 2px 8px rgba(0,0,0,0.15);
                cursor:pointer;border-radius:2px;
              ">KSh ${label}</div>
              <div style="
                width:0;height:0;
                border-left:5px solid transparent;
                border-right:5px solid transparent;
                border-top:7px solid ${isSelected ? '#1a6b4a' : 'white'};
              "></div>
            </div>`,
          className:  '',
          iconSize:   [80, 32],
          iconAnchor: [40, 32],
        })

        const marker = L.marker([prop.latitude, prop.longitude], { icon }).addTo(map)
        marker.on('click', () => onSelectProperty(prop.id))
        markersRef.current.set(prop.id, marker)
      })

      // Fit map to show all property pins
      if (properties.length > 0) {
        const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]))
        map.fitBounds(bounds, { padding: [60, 60] })
      }

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
      markersRef.current.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  )
}
