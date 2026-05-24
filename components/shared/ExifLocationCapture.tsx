'use client'
import { useState, useRef, useEffect } from 'react'

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
  const [fromGallery,    setFromGallery]    = useState(false)
  const [allFiles,       setAllFiles]       = useState<File[]>([])
  const [allPreviews,    setAllPreviews]    = useState<string[]>([])
  const [showAddOptions, setShowAddOptions] = useState(false)
  const [manualPlusCode, setManualPlusCode] = useState('')
  const [manualStatus,   setManualStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [manualError,    setManualError]    = useState('')

  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInstanceRef  = useRef<unknown>(null)
  const cameraRef       = useRef<HTMLInputElement>(null)
  const galleryRef      = useRef<HTMLInputElement>(null)
  const moreCameraRef   = useRef<HTMLInputElement>(null)
  const moreGalleryRef  = useRef<HTMLInputElement>(null)
  // Keep a ref to avoid stale closure in useEffect
  const onPhotosRef     = useRef(onPhotosSelected)
  onPhotosRef.current   = onPhotosSelected

  // Notify parent whenever allFiles changes
  useEffect(() => {
    if (allFiles.length > 0) {
      onPhotosRef.current(allFiles)
    }
  }, [allFiles])

  // ── helpers ──────────────────────────────────────────────────────────────────

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

    mapRef.current.innerHTML = ''
    const map = L.map(mapRef.current, {
      zoomControl:     false,
      dragging:        false,
      scrollWheelZoom: false,
    }).setView([lat, lng], 18)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '',
    }).addTo(map)

    L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="width:16px;height:16px;background:#1a6b4a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        className: '', iconSize: [16, 16], iconAnchor: [8, 8],
      }),
      interactive: false,
    }).addTo(map)
  }

  async function handleFiles(files: FileList | null, isFromGallery = false) {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    setPhotoCount(fileArray.length)
    setStatus('reading')
    setManualPlusCode('')
    setManualStatus('idle')
    setFromGallery(false)
    setShowAddOptions(false)

    // Seed allFiles/allPreviews with first batch
    setAllFiles(fileArray)
    setAllPreviews(fileArray.map(f => URL.createObjectURL(f)))

    let bestLat: number | null = null
    let bestLng: number | null = null

    try {
      const exifr = (await import('exifr')).default
      for (const file of fileArray) {
        try {
          const gps = await exifr.gps(file)
          if (gps?.latitude && gps?.longitude) {
            const { latitude: lat, longitude: lng } = gps
            if (lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42) {
              bestLat = lat
              bestLng = lng
              break
            }
          }
        } catch { /* skip */ }
      }
    } catch { /* exifr unavailable */ }

    if (bestLat !== null && bestLng !== null) {
      setFoundCoords({ lat: bestLat, lng: bestLng })
      setFromGallery(isFromGallery)
      setStatus('found')
      const addr = await reverseGeocode(bestLat, bestLng)
      setAddress(addr)
      onLocationFound(bestLat, bestLng, addr, 'exif')
      await initMap(bestLat, bestLng)
    } else {
      if (isFromGallery) setFromGallery(true)
      setStatus('notfound')
    }
  }

  function addMorePhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    const newFiles    = Array.from(files)
    const newPreviews = newFiles.map(f => URL.createObjectURL(f))
    setAllFiles(prev    => [...prev, ...newFiles])
    setAllPreviews(prev => [...prev, ...newPreviews])
  }

  function removePhoto(index: number) {
    setAllFiles(prev    => prev.filter((_, i) => i !== index))
    setAllPreviews(prev => prev.filter((_, i) => i !== index))
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
          if (data[0]) { refLat = parseFloat(data[0].lat); refLng = parseFloat(data[0].lon) }
        } catch { /* use Nairobi */ }
      }

      if (!OpenLocationCode.isValid(cleanCode)) {
        setManualStatus('error')
        setManualError('Invalid Plus Code. Example: GW4G+FH or 6G3QGW4G+FH')
        return
      }

      let lat: number, lng: number
      if (OpenLocationCode.isShort(cleanCode)) {
        const full    = OpenLocationCode.recoverNearest(cleanCode, refLat, refLng)
        const decoded = OpenLocationCode.decode(full)
        lat = decoded.latitudeCenter; lng = decoded.longitudeCenter
      } else {
        const decoded = OpenLocationCode.decode(cleanCode)
        lat = decoded.latitudeCenter; lng = decoded.longitudeCenter
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

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── IDLE: camera-first capture UI ──────────────────────────────────── */}
      {status === 'idle' && (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c', marginBottom: '8px' }}>
            Property Photos *
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              style={{
                width: '100%', padding: '20px 16px',
                background: '#1a6b4a', color: '#fff',
                border: 'none', borderRadius: '16px',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ fontSize: '36px' }}>📷</span>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Take photos now</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                Stand at the property and take photos.<br/>
                GPS is captured automatically from the camera.
              </div>
            </button>

            <div style={{
              padding: '12px 14px',
              background: 'rgba(26,107,74,0.06)',
              border: '1px solid rgba(26,107,74,0.15)',
              borderRadius: '12px',
              fontSize: '12px', color: '#6b6055', lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: 700, color: '#0f0e0c', marginBottom: '4px' }}>
                Before taking photos:
              </div>
              1. Make sure you are physically at the property<br/>
              2. Enable camera location: Settings → Camera → Location → Allow<br/>
              3. Take at least 3 photos of different rooms
            </div>

            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              style={{
                width: '100%', padding: '12px',
                background: 'transparent', color: '#6b6055',
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: '12px',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '13px', fontWeight: 500,
              }}
            >
              📁 Upload from gallery instead
            </button>
          </div>
        </div>
      )}

      {/* ── READING: spinner ───────────────────────────────────────────────── */}
      {status === 'reading' && (
        <div style={{
          padding: '14px',
          background: 'rgba(26,107,74,0.06)',
          border: '1px solid rgba(26,107,74,0.15)',
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

      {/* ── FOUND: GPS badge + address + map ───────────────────────────────── */}
      {status === 'found' && foundCoords && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {fromGallery ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(232,160,32,0.15)', color: '#b07a10',
              fontSize: '12px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '20px',
              alignSelf: 'flex-start',
            }}>
              ⚠️ Location from gallery photo
            </div>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#1a6b4a', color: '#fff',
              fontSize: '12px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '20px',
              alignSelf: 'flex-start',
            }}>
              📍 GPS Verified · taken at property
            </div>
          )}

          <div style={{
            padding: '12px 14px',
            background: 'rgba(26,107,74,0.08)',
            border: '1px solid rgba(26,107,74,0.25)',
            borderRadius: '12px',
          }}>
            <div style={{ fontSize: '12px', color: '#6b6055', lineHeight: 1.4, marginBottom: '6px' }}>
              {address}
            </div>
            <div style={{ fontSize: '11px', color: '#b0a898', fontFamily: 'monospace' }}>
              🔒 {foundCoords.lat.toFixed(7)}, {foundCoords.lng.toFixed(7)}
            </div>
          </div>

          <div
            ref={mapRef}
            style={{
              height: '180px', borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden', background: '#f0f0eb',
            }}
          />
        </div>
      )}

      {/* ── NOT FOUND: warning + retake + Plus Code ────────────────────────── */}
      {status === 'notfound' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            padding: '12px 14px',
            background: 'rgba(232,160,32,0.08)',
            border: '1px solid rgba(232,160,32,0.25)',
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
              setAllFiles([])
              setAllPreviews([])
              setStatus('idle')
              setFromGallery(false)
              cameraRef.current?.click()
            }}
            style={{
              padding: '12px',
              background: '#1a6b4a', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            📷 Retake photos with location on
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
                onChange={e => { setManualPlusCode(e.target.value); setManualStatus('idle'); setManualError('') }}
                placeholder="e.g. GW4G+FH Nairobi"
                style={{
                  flex: 1, padding: '11px 12px',
                  background: '#f5f5f5',
                  border: manualStatus === 'error'   ? '2px solid #dc2626'
                        : manualStatus === 'success' ? '2px solid #1a6b4a'
                        :                             '2px solid transparent',
                  borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600,
                  color: '#0f0e0c', outline: 'none', fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={() => void handleManualPlusCode()}
                disabled={!manualPlusCode.trim() || manualStatus === 'loading'}
                style={{
                  padding: '11px 16px',
                  background: manualPlusCode.trim() ? '#1a6b4a' : '#ccc',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700,
                  cursor: manualPlusCode.trim() ? 'pointer' : 'not-allowed',
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
              <div style={{ fontSize: '12px', color: '#dc2626' }}>⚠️ {manualError}</div>
            )}
            {manualStatus === 'success' && foundCoords && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(26,107,74,0.08)',
                  border: '1px solid rgba(26,107,74,0.2)',
                  borderRadius: '10px',
                  fontSize: '12px', color: '#1a6b4a', fontWeight: 600,
                }}>
                  ✅ Location set · {address}
                </div>
                <div
                  ref={mapRef}
                  style={{
                    height: '160px', borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.08)',
                    overflow: 'hidden', background: '#f0f0eb',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PHOTO GRID: shown after first batch processed ──────────────────── */}
      {(status === 'found' || status === 'notfound') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '13px', fontWeight: 700, color: '#0f0e0c',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Photos ({allPreviews.length})</span>
            <span style={{ fontSize: '12px', color: '#b0a898', fontWeight: 400 }}>
              {allPreviews.length < 3
                ? `Add ${3 - allPreviews.length} more recommended`
                : 'Looking good!'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {allPreviews.map((url, i) => (
              <div key={i} style={{
                position: 'relative', aspectRatio: '1',
                borderRadius: '10px', overflow: 'hidden', background: '#f0f0eb',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {i === 0 && status === 'found' && (
                  <div style={{
                    position: 'absolute', bottom: '4px', left: '4px',
                    background: '#1a6b4a', color: '#fff',
                    fontSize: '8px', fontWeight: 700,
                    padding: '2px 5px', borderRadius: '4px',
                  }}>
                    GPS
                  </div>
                )}
                {(i > 0 || allPreviews.length > 1) && (
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '22px', height: '22px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      fontSize: '12px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Add more — grid cell */}
            <div
              onClick={() => setShowAddOptions(v => !v)}
              style={{
                aspectRatio: '1', borderRadius: '10px',
                border: '2px dashed rgba(26,107,74,0.3)',
                background: 'rgba(26,107,74,0.03)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', gap: '4px',
              }}
            >
              <span style={{ fontSize: '22px' }}>+</span>
              <span style={{ fontSize: '10px', color: '#1a6b4a', fontWeight: 600 }}>Add more</span>
            </div>
          </div>

          {/* Add-more options panel */}
          {showAddOptions && (
            <div style={{
              display: 'flex', gap: '8px',
              padding: '12px', background: '#f5f5f5', borderRadius: '12px',
            }}>
              <button
                type="button"
                onClick={() => { moreCameraRef.current?.click(); setShowAddOptions(false) }}
                style={{
                  flex: 1, padding: '12px 8px',
                  background: '#1a6b4a', color: '#fff',
                  border: 'none', borderRadius: '10px',
                  fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                }}
              >
                <span style={{ fontSize: '22px' }}>📷</span>
                Take photo
              </button>
              <button
                type="button"
                onClick={() => { moreGalleryRef.current?.click(); setShowAddOptions(false) }}
                style={{
                  flex: 1, padding: '12px 8px',
                  background: '#fff', color: '#0f0e0c',
                  border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px',
                  fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                }}
              >
                <span style={{ fontSize: '22px' }}>🖼</span>
                From gallery
              </button>
              <button
                type="button"
                onClick={() => setShowAddOptions(false)}
                style={{
                  padding: '12px 8px',
                  background: 'none', color: '#b0a898',
                  border: 'none', borderRadius: '10px',
                  fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Hidden inputs ──────────────────────────────────────────────────── */}

      {/* First capture — camera only */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={e => void handleFiles(e.target.files)}
      />
      {/* First capture — gallery fallback */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => void handleFiles(e.target.files, true)}
      />
      {/* Additional photos — camera */}
      <input
        ref={moreCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={e => addMorePhotos(e.target.files)}
      />
      {/* Additional photos — gallery */}
      <input
        ref={moreGalleryRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => addMorePhotos(e.target.files)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
