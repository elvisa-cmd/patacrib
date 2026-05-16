'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

interface Property {
  id:         string
  price:      number
  latitude?:  number | null
  longitude?: number | null
  estate?:    string | null
  city?:      string | null
  title:      string
}

interface Props {
  properties: Property[]
  avgPrice:   number
  tourCount:  number
}

export default function HomeMiniMap({ properties, avgPrice, tourCount }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  const mappable = properties.filter(p =>
    p.latitude && p.longitude &&
    !(Math.abs(p.latitude - (-1.286389)) < 0.001 && Math.abs(p.longitude - 36.817223) < 0.001)
  )

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (!mapRef.current || mapInstanceRef.current) return

      const center: [number, number] = mappable.length > 0
        ? [
            mappable.reduce((s, p) => s + p.latitude!, 0) / mappable.length,
            mappable.reduce((s, p) => s + p.longitude!, 0) / mappable.length,
          ]
        : [-1.2921, 36.8219]

      const map = L.map(mapRef.current, {
        center,
        zoom:             12,
        zoomControl:      false,
        dragging:         false,
        scrollWheelZoom:  false,
        doubleClickZoom:  false,
        touchZoom:        false,
        keyboard:         false,
        attributionControl: false,
      })

      mapInstanceRef.current = map

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '' }
      ).addTo(map)

      mappable.forEach(p => {
        const priceLabel = `KSh ${Math.round(p.price / 1000)}K`

        const icon = L.divIcon({
          html: `<div style="
            background:rgba(255,255,255,0.95);
            border:1.5px solid rgba(26,107,74,0.3);
            border-radius:20px;
            padding:4px 10px;
            font-size:11px;
            font-weight:700;
            color:#1a6b4a;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.12);
            font-family:inherit;
            transform:translateX(-50%) translateY(-100%);
          ">${priceLabel}</div>`,
          className:  '',
          iconSize:   [0, 0],
          iconAnchor: [0, 0],
        })

        const marker = L.marker([p.latitude!, p.longitude!], { icon })
        marker.addTo(map)
        marker.on('click', () => {
          window.location.href = `/property/${p.id}`
        })
      })

      if (mappable.length > 1) {
        const bounds = L.latLngBounds(
          mappable.map(p => [p.latitude!, p.longitude!] as [number, number])
        )
        map.fitBounds(bounds, { padding: [30, 30] })
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '0 12px', marginBottom: '16px' }}>

      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '10px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', letterSpacing: '-0.3px' }}>
          Properties on map
        </div>
        <Link href="/browse/map" style={{
          fontSize:       '11px',
          color:          '#1a6b4a',
          fontWeight:     600,
          textDecoration: 'none',
          display:        'flex',
          alignItems:     'center',
          gap:            '3px',
        }}>
          Full map
          <svg width="12" height="12" fill="none" stroke="#1a6b4a"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Real Leaflet map */}
      <Link href="/browse/map" style={{ display: 'block', textDecoration: 'none', position: 'relative' }}>
        <div
          ref={mapRef}
          style={{
            height:       '150px',
            borderRadius: '18px',
            overflow:     'hidden',
            background:   '#e8ede8',
            marginBottom: '10px',
            cursor:       'pointer',
          }}
        />

        {/* "Open full map" button overlaid at bottom */}
        <div style={{
          position:       'absolute',
          bottom:         '18px',
          left:           '50%',
          transform:      'translateX(-50%)',
          background:     '#1a6b4a',
          color:          '#fff',
          fontSize:       '11px',
          fontWeight:     700,
          padding:        '7px 18px',
          borderRadius:   '20px',
          whiteSpace:     'nowrap',
          display:        'flex',
          alignItems:     'center',
          gap:            '5px',
          boxShadow:      '0 4px 12px rgba(26,107,74,0.35)',
          pointerEvents:  'none',
        }}>
          <svg width="12" height="12" fill="none" stroke="#fff"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            viewBox="0 0 24 24">
            <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4M9 7l6-3"/>
          </svg>
          Open full map
        </div>
      </Link>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[
          { n: properties.length,                                       l: 'Listings'   },
          { n: tourCount,                                               l: 'With tours' },
          { n: avgPrice > 0 ? `${Math.round(avgPrice / 1000)}K` : '—', l: 'Avg price'  },
        ].map((s, i) => (
          <div key={i} style={{
            background:   '#fff',
            border:       '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px',
            padding:      '10px 8px',
            textAlign:    'center',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a6b4a', marginBottom: '2px' }}>
              {s.n}
            </div>
            <div style={{ fontSize: '10px', color: '#b0a898', fontWeight: 500 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
