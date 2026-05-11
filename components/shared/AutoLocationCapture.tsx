'use client'
import { useEffect, useRef, useState } from 'react'

type Status = 'locating' | 'captured' | 'denied' | 'failed' | 'retrying'

interface Props {
  onCapture: (lat: number, lng: number, address: string) => void
  onFail: () => void
}

export default function AutoLocationCapture({ onCapture, onFail }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [status, setStatus] = useState<Status>('locating')
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const retryCount = useRef(0)

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      return data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  async function initMap(lat: number, lng: number, acc: number) {
    if (!mapRef.current) return
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 18)
      return
    }

    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    const map = L.map(mapRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    }).setView([lat, lng], 18)

    mapInstance.current = map

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '' }
    ).addTo(map)

    // Accuracy circle
    L.circle([lat, lng], {
      radius: acc,
      color: '#1a6b4a',
      fillColor: '#1a6b4a',
      fillOpacity: 0.08,
      weight: 1,
    }).addTo(map)

    // Fixed pin — NOT draggable
    const icon = L.divIcon({
      html: `<div style="
        width: 20px;
        height: 20px;
        background: #1a6b4a;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    // draggable: false — pin is locked to GPS position
    L.marker([lat, lng], { icon, draggable: false }).addTo(map)

    // Clicking the map does nothing
    map.on('click', () => {})
  }

  function captureGPS() {
    if (!navigator.geolocation) {
      setStatus('failed')
      onFail()
      return
    }

    setStatus(retryCount.current > 0 ? 'retrying' : 'locating')

    // Stage 1: Fast rough location first
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
        setCoords({ lat, lng })
        setAccuracy(Math.round(acc))
        await initMap(lat, lng, acc)
        const addr = await reverseGeocode(lat, lng)
        setAddress(addr)
        setStatus('captured')
        onCapture(lat, lng, addr)

        // Stage 2: High accuracy refinement (silent)
        navigator.geolocation.getCurrentPosition(
          async (pos2) => {
            const { latitude: lat2, longitude: lng2, accuracy: acc2 } = pos2.coords
            setCoords({ lat: lat2, lng: lng2 })
            setAccuracy(Math.round(acc2))
            if (mapInstance.current) {
              mapInstance.current.setView([lat2, lng2], 19)
            }
            const addr2 = await reverseGeocode(lat2, lng2)
            setAddress(addr2)
            onCapture(lat2, lng2, addr2)
          },
          () => {}, // Silent fail — stage 1 coords are good enough
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        )
      },
      (err) => {
        if (err.code === 1) {
          // Permission denied — cannot retry
          setStatus('denied')
          onFail()
        } else {
          // Timeout or unavailable — retry up to 3 times
          if (retryCount.current < 3) {
            retryCount.current++
            setTimeout(captureGPS, 2000)
          } else {
            setStatus('failed')
            onFail()
          }
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5000 }
    )
  }

  useEffect(() => {
    captureGPS()
    return () => { mapInstance.current?.remove(); mapInstance.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {status === 'locating' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(26,107,74,0.08)', borderRadius: '10px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #1a6b4a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a6b4a' }}>Capturing exact location...</div>
            <div style={{ fontSize: '11px', color: '#6b6055', marginTop: '2px' }}>Please keep device still and outdoors for best accuracy</div>
          </div>
        </div>
      )}

      {status === 'retrying' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(232,160,32,0.08)', borderRadius: '10px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #e8a020', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8a020' }}>Retrying... ({retryCount.current}/3)</div>
            <div style={{ fontSize: '11px', color: '#6b6055', marginTop: '2px' }}>Move to an open area for better GPS signal</div>
          </div>
        </div>
      )}

      {status === 'captured' && (
        <div style={{ padding: '12px 16px', background: 'rgba(26,107,74,0.08)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a6b4a' }}>Location captured</span>
            {accuracy && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b6055', background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: '20px' }}>
                ±{accuracy}m accuracy
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5 }}>{address}</div>
          <div style={{ fontSize: '10px', color: '#b0a898', marginTop: '4px', fontFamily: 'monospace' }}>
            {coords?.lat.toFixed(7)}, {coords?.lng.toFixed(7)}
          </div>
        </div>
      )}

      {status === 'denied' && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.08)', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>🚫 Location access denied</div>
          <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.6 }}>
            GPS is required to list a property on PataKrib. This ensures renters can find your property accurately.<br/>
            <strong>To fix:</strong> Go to your browser settings → Site permissions → Location → Allow for this site.
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.08)', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>📡 Unable to get GPS signal</div>
          <div style={{ fontSize: '12px', color: '#6b6055', marginBottom: '10px', lineHeight: 1.6 }}>
            Please check your GPS signal. Move to an open area or enable WiFi for better location accuracy.
          </div>
          <button
            onClick={() => { retryCount.current = 0; captureGPS() }}
            style={{ background: '#1a6b4a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Map — only shows when location is captured */}
      <div
        ref={mapRef}
        style={{
          height: status === 'captured' ? '280px' : '0px',
          borderRadius: '12px',
          border: status === 'captured' ? '1px solid rgba(0,0,0,0.1)' : 'none',
          overflow: 'hidden',
          background: '#f0f0eb',
          transition: 'height 0.3s ease',
        }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
