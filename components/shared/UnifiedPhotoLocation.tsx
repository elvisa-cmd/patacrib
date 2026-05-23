'use client'
import { useRef, useState, useEffect } from 'react'

interface Props {
  onPhotosChanged: (files: File[]) => void
  onLocationFound: (lat: number, lng: number, address: string) => void
  existingPhotos?: string[]
}

export default function UnifiedPhotoLocation({
  onPhotosChanged,
  onLocationFound,
  existingPhotos = [],
}: Props) {
  const [allFiles,            setAllFiles]            = useState<File[]>([])
  const [allPreviews,         setAllPreviews]         = useState<string[]>([])
  const [gpsStatus,           setGpsStatus]           = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle')
  const [locationCoords,      setLocationCoords]      = useState<{ lat: number; lng: number } | null>(null)
  const [locationAddress,     setLocationAddress]     = useState('')
  const [showGalleryFallback, setShowGalleryFallback] = useState(false)
  const [pasteLink,           setPasteLink]           = useState('')
  const [linkError,           setLinkError]           = useState('')

  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const onPhotosRef     = useRef(onPhotosChanged)
  onPhotosRef.current   = onPhotosChanged

  useEffect(() => {
    if (allFiles.length > 0) {
      onPhotosRef.current(allFiles)
    }
  }, [allFiles])

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

  function captureGPS() {
    setGpsStatus('capturing')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocationCoords({ lat, lng })
        const addr = await reverseGeocode(lat, lng)
        setLocationAddress(addr)
        setGpsStatus('success')
        setShowGalleryFallback(false)
        onLocationFound(lat, lng, addr)
      },
      () => {
        setGpsStatus('failed')
        setShowGalleryFallback(true)
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }

  function handleLiveCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileArray   = Array.from(files)
    const newPreviews = fileArray.map(f => URL.createObjectURL(f))
    setAllFiles(prev    => [...prev, ...fileArray])
    setAllPreviews(prev => [...prev, ...newPreviews])
    if (gpsStatus !== 'success') captureGPS()
    e.target.value = ''
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileArray   = Array.from(files)
    const newPreviews = fileArray.map(f => URL.createObjectURL(f))
    setAllFiles(prev    => [...prev, ...fileArray])
    setAllPreviews(prev => [...prev, ...newPreviews])
    if (gpsStatus !== 'success') setShowGalleryFallback(true)
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setAllFiles(prev    => prev.filter((_, i) => i !== index))
    setAllPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function parseGoogleMapsLink(url: string): { lat: number; lng: number } | null {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ]
    for (const p of patterns) {
      const m = url.match(p)
      if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) }
    }
    return null
  }

  async function handleLinkSet() {
    setLinkError('')
    const found = parseGoogleMapsLink(pasteLink.trim())
    if (!found) {
      setLinkError('Could not read coordinates. Copy the full Google Maps link.')
      return
    }
    const addr = await reverseGeocode(found.lat, found.lng)
    setLocationCoords(found)
    setLocationAddress(addr)
    setGpsStatus('success')
    setShowGalleryFallback(false)
    onLocationFound(found.lat, found.lng, addr)
  }

  const totalCount = existingPhotos.length + allPreviews.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c' }}>
        Photos &amp; Location *
      </div>

      {/* Primary — live camera */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        style={{
          width: '100%', padding: '20px 16px',
          background: '#1a6b4a', color: '#fff',
          border: 'none', borderRadius: '14px',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '6px',
        }}
      >
        <span style={{ fontSize: '32px' }}>📸</span>
        <div style={{ fontSize: '16px', fontWeight: 700 }}>Take photos at property</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          Camera opens directly — location captured automatically
        </div>
      </button>

      {/* Secondary — gallery */}
      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        style={{
          width: '100%', padding: '11px 14px',
          background: 'transparent', color: '#6b6055',
          border: '1px solid rgba(0,0,0,0.12)', borderRadius: '12px',
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: '13px', fontWeight: 500,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '3px',
        }}
      >
        <span>⬆️ Upload from gallery</span>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          Location verification required separately
        </span>
      </button>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={handleLiveCameraChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleGalleryChange}
      />

      {/* Photo preview strip */}
      {totalCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b6055' }}>
            {totalCount} photo{totalCount !== 1 ? 's' : ''}
            {totalCount < 3 && (
              <span style={{ color: '#9ca3af', fontWeight: 400 }}>
                {' '}· {3 - totalCount} more recommended
              </span>
            )}
          </div>
          <div style={{
            display: 'flex', gap: '8px',
            overflowX: 'auto', paddingBottom: '4px',
          }}>
            {existingPhotos.map((url, i) => (
              <div
                key={`e-${i}`}
                style={{
                  position: 'relative', flexShrink: 0,
                  width: '80px', height: '80px',
                  borderRadius: '8px', overflow: 'hidden', background: '#f0f0eb',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {allPreviews.map((url, i) => (
              <div
                key={`n-${i}`}
                style={{
                  position: 'relative', flexShrink: 0,
                  width: '80px', height: '80px',
                  borderRadius: '8px', overflow: 'hidden', background: '#f0f0eb',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: '3px', right: '3px',
                    width: '20px', height: '20px',
                    background: 'rgba(0,0,0,0.65)', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: '1',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location status — capturing */}
      {gpsStatus === 'capturing' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#fffbeb', border: '1px solid #f59e0b',
          borderRadius: '10px', padding: '10px 14px',
          fontSize: '13px', color: '#92400e', fontWeight: 600,
        }}>
          <div style={{
            width: '14px', height: '14px', flexShrink: 0,
            border: '2px solid #f59e0b', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'uplcspin 0.8s linear infinite',
          }} />
          📍 Getting location...
        </div>
      )}

      {/* Location status — success */}
      {gpsStatus === 'success' && locationCoords && (
        <div style={{
          background: '#f0fdf4', border: '1px solid rgba(26,107,74,0.3)',
          borderRadius: '10px', padding: '10px 14px',
        }}>
          <div style={{ fontSize: '13px', color: '#1a6b4a', fontWeight: 700 }}>
            📍 Location verified ✅
          </div>
          {locationAddress && (
            <div style={{ fontSize: '11px', color: '#6b6055', marginTop: '3px' }}>
              {locationAddress.length > 60
                ? locationAddress.slice(0, 60) + '…'
                : locationAddress}
            </div>
          )}
        </div>
      )}

      {/* Location status — fallback (GPS failed or gallery-only) */}
      {(gpsStatus === 'failed' || showGalleryFallback) && gpsStatus !== 'success' && (
        <div style={{
          border: '1.5px solid #f59e0b', borderRadius: '12px',
          padding: '14px', background: '#fffbeb',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>
            📍 GPS blocked — set location manually
          </div>
          <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>
            Open Google Maps → find this property → tap Share → Copy link → paste below
          </div>
          <textarea
            value={pasteLink}
            onChange={e => { setPasteLink(e.target.value); setLinkError('') }}
            placeholder="Paste Google Maps link here..."
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: linkError ? '2px solid #ef4444' : '1.5px solid #d1d5db',
              fontSize: '13px', fontFamily: 'inherit', resize: 'none',
              outline: 'none', boxSizing: 'border-box', color: '#1a1a1a',
              background: '#fff',
            }}
          />
          {linkError && (
            <div style={{ fontSize: '12px', color: '#ef4444' }}>{linkError}</div>
          )}
          <button
            type="button"
            onClick={() => void handleLinkSet()}
            disabled={!pasteLink.trim()}
            style={{
              padding: '12px',
              background: pasteLink.trim() ? '#1a6b4a' : '#9ca3af',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontWeight: 700, fontSize: '14px',
              cursor: pasteLink.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            Set location from link
          </button>
        </div>
      )}

      {/* Minimum notice */}
      <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.5 }}>
        Minimum 3 photos required. Take photos of: entrance, living room, bedroom, kitchen
      </div>

      <style>{`@keyframes uplcspin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
