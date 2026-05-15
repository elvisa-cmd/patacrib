'use client'
import { useState, useRef } from 'react'

interface Props {
  onLocationFound:  (lat: number, lng: number, address: string, source: 'exif' | 'manual') => void
  onPhotosSelected: (files: File[]) => void
  currentPhotos?:   string[]
}

export default function ExifLocationCapture({
  onLocationFound,
  onPhotosSelected,
}: Props) {
  const [status,         setStatus]         = useState<'idle' | 'reading' | 'found' | 'notfound'>('idle')
  const [foundCoords,    setFoundCoords]    = useState<{ lat: number; lng: number } | null>(null)
  const [address,        setAddress]        = useState('')
  const [photoCount,     setPhotoCount]     = useState(0)
  const [previews,       setPreviews]       = useState<string[]>([])
  const [manualPlusCode, setManualPlusCode] = useState('')
  const [manualStatus,   setManualStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [manualError,    setManualError]    = useState('')
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json() as { display_name?: string }
      return data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  async function initMap(lat: number, lng: number) {
    if (!mapRef.current) return
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    // Clear any existing map
    mapRef.current.innerHTML = ''
    const map = L.map(mapRef.current, {
      zoomControl:       false,
      dragging:          false,
      scrollWheelZoom:   false,
    }).setView([lat, lng], 18)
    // Store reference for cleanup
    ;(mapInstanceRef as React.MutableRefObject<unknown>).current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '',
    }).addTo(map)

    L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="
          width:16px;height:16px;
          background:#1a6b4a;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        className:  '',
        iconSize:   [16, 16],
        iconAnchor: [8, 8],
      }),
      interactive: false,
    }).addTo(map)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    setPhotoCount(fileArray.length)
    setStatus('reading')
    setManualPlusCode('')
    setManualStatus('idle')

    const previewUrls = fileArray.map(f => URL.createObjectURL(f))
    setPreviews(previewUrls)
    onPhotosSelected(fileArray)

    let bestLat: number | null = null
    let bestLng: number | null = null

    try {
      const exifr = (await import('exifr')).default
      for (const file of fileArray) {
        try {
          const gps = await exifr.gps(file)
          if (gps?.latitude && gps?.longitude) {
            const lat = gps.latitude
            const lng = gps.longitude
            if (lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42) {
              bestLat = lat
              bestLng = lng
              break
            }
          }
        } catch { /* skip file */ }
      }
    } catch { /* exifr unavailable */ }

    if (bestLat !== null && bestLng !== null) {
      setFoundCoords({ lat: bestLat, lng: bestLng })
      setStatus('found')
      const addr = await reverseGeocode(bestLat, bestLng)
      setAddress(addr)
      onLocationFound(bestLat, bestLng, addr, 'exif')
      await initMap(bestLat, bestLng)
    } else {
      setStatus('notfound')
    }
  }

  async function handleManualPlusCode() {
    if (!manualPlusCode.trim()) return
    setManualStatus('loading')
    setManualError('')

    try {
      const { OpenLocationCode } = await import('open-location-code')
      let cleanCode = manualPlusCode.trim().toUpperCase()
      let refLat    = -1.2864
      let refLng    = 36.8172

      if (cleanCode.includes(' ')) {
        const parts    = cleanCode.split(' ')
        cleanCode      = parts[0]
        const cityName = parts.slice(1).join(' ')
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName + ' Kenya')}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } },
          )
          const data = await res.json() as Array<{ lat: string; lon: string }>
          if (data[0]) {
            refLat = parseFloat(data[0].lat)
            refLng = parseFloat(data[0].lon)
          }
        } catch { /* use Nairobi default */ }
      }

      if (!OpenLocationCode.isValid(cleanCode)) {
        setManualStatus('error')
        setManualError('Invalid Plus Code. Example: GW4G+FH or 6G3QGW4G+FH')
        return
      }

      let lat: number
      let lng: number

      if (OpenLocationCode.isShort(cleanCode)) {
        const fullCode = OpenLocationCode.recoverNearest(cleanCode, refLat, refLng)
        const decoded  = OpenLocationCode.decode(fullCode)
        lat = decoded.latitudeCenter
        lng = decoded.longitudeCenter
      } else {
        const decoded = OpenLocationCode.decode(cleanCode)
        lat = decoded.latitudeCenter
        lng = decoded.longitudeCenter
      }

      if (lat < -5 || lat > 5 || lng < 33 || lng > 42) {
        setManualStatus('error')
        setManualError('This location is not in Kenya.')
        return
      }

      const addr = await reverseGeocode(lat, lng)
      setManualStatus('success')
      setFoundCoords({ lat, lng })
      setAddress(addr)
      onLocationFound(lat, lng, addr, 'manual')
      await initMap(lat, lng)
    } catch {
      setManualStatus('error')
      setManualError('Could not decode this Plus Code. Please check and try again.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Photo upload area */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c', marginBottom: '8px' }}>
          Property Photos *
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border:     '2px dashed rgba(26,107,74,0.3)',
            borderRadius: '14px',
            padding:    '24px 16px',
            textAlign:  'center',
            cursor:     'pointer',
            background: 'rgba(26,107,74,0.03)',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', marginBottom: '4px' }}>
            Upload property photos
          </div>
          <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5 }}>
            Take photos AT the property with your phone.<br/>
            We automatically extract the GPS location from your photos.
          </div>
          <div style={{
            marginTop:    '12px',
            display:      'inline-block',
            background:   '#1a6b4a', color: '#fff',
            padding:      '8px 20px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 600,
          }}>
            Choose photos
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => void handleFiles(e.target.files)}
        />
      </div>

      {/* Reading EXIF */}
      {status === 'reading' && (
        <div style={{
          padding:    '14px',
          background: 'rgba(26,107,74,0.06)',
          border:     '1px solid rgba(26,107,74,0.15)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '18px', height: '18px', flexShrink: 0,
            border: '2px solid #1a6b4a', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: '13px', color: '#1a6b4a', fontWeight: 600 }}>
            Reading location from {photoCount} photo{photoCount > 1 ? 's' : ''}...
          </div>
        </div>
      )}

      {/* Photo previews */}
      {previews.length > 0 && status !== 'reading' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {previews.map((url, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: '10px',
              overflow:     'hidden',
              background:   '#f0f0eb',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* GPS found from EXIF */}
      {status === 'found' && foundCoords && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            padding:      '12px 14px',
            background:   'rgba(26,107,74,0.08)',
            border:       '1px solid rgba(26,107,74,0.25)',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a6b4a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✅</span>GPS location extracted from photo
            </div>
            <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.4, marginBottom: '6px' }}>
              {address}
            </div>
            <div style={{ fontSize: '11px', color: '#b0a898', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔒 {foundCoords.lat.toFixed(7)}, {foundCoords.lng.toFixed(7)}
            </div>
          </div>
          <div
            ref={mapRef}
            style={{
              height:     '180px',
              borderRadius: '12px',
              border:     '1px solid rgba(0,0,0,0.08)',
              overflow:   'hidden',
              background: '#f0f0eb',
            }}
          />
        </div>
      )}

      {/* GPS not found — fallback to Plus Code */}
      {status === 'notfound' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            padding:      '12px 14px',
            background:   'rgba(232,160,32,0.08)',
            border:       '1px solid rgba(232,160,32,0.25)',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8a020', marginBottom: '4px' }}>
              ⚠️ No GPS found in photos
            </div>
            <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5 }}>
              Your photos do not have location data. This happens when:<br/>
              • Camera location is turned off<br/>
              • Photos were sent via WhatsApp (strips GPS)<br/>
              • Screenshots used instead of real photos<br/><br/>
              <strong>Please enable camera location</strong> and retake photos,
              or enter a Plus Code below.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreviews([])
              setStatus('idle')
              inputRef.current?.click()
            }}
            style={{
              padding:      '12px',
              background:   '#1a6b4a', color: '#fff',
              border:       'none', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            📸 Retake photos with location on
          </button>

          <div style={{ fontSize: '12px', color: '#b0a898', textAlign: 'center', fontWeight: 500 }}>
            — or set location manually —
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.5 }}>
              Open Google Maps → tap your blue dot → copy the Plus Code shown at top
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={manualPlusCode}
                onChange={e => {
                  setManualPlusCode(e.target.value)
                  setManualStatus('idle')
                  setManualError('')
                }}
                placeholder="e.g. GW4G+FH Nairobi"
                style={{
                  flex:      1,
                  padding:   '11px 12px',
                  background: '#f5f5f5',
                  border:    manualStatus === 'error'   ? '2px solid #dc2626'
                           : manualStatus === 'success' ? '2px solid #1a6b4a'
                           :                             '2px solid transparent',
                  borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600,
                  color: '#0f0e0c', outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={() => void handleManualPlusCode()}
                disabled={!manualPlusCode.trim() || manualStatus === 'loading'}
                style={{
                  padding:   '11px 16px',
                  background: manualPlusCode.trim() ? '#1a6b4a' : '#ccc',
                  color:     '#fff', border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700,
                  cursor:    manualPlusCode.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {manualStatus === 'loading' ? (
                  <div style={{
                    width: '14px', height: '14px',
                    border: '2px solid #fff', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                ) : 'Set'}
              </button>
            </div>

            {manualStatus === 'error' && (
              <div style={{ fontSize: '12px', color: '#dc2626' }}>
                ⚠️ {manualError}
              </div>
            )}

            {manualStatus === 'success' && foundCoords && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  padding:      '10px 12px',
                  background:   'rgba(26,107,74,0.08)',
                  border:       '1px solid rgba(26,107,74,0.2)',
                  borderRadius: '10px',
                  fontSize: '12px', color: '#1a6b4a', fontWeight: 600,
                }}>
                  ✅ Location set · {address}
                </div>
                <div
                  ref={mapRef}
                  style={{
                    height:     '160px',
                    borderRadius: '12px',
                    border:     '1px solid rgba(0,0,0,0.08)',
                    overflow:   'hidden',
                    background: '#f0f0eb',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
