'use client'
import { useRef, useState, useCallback } from 'react'

interface Props {
  onPhotosChanged: (files: File[]) => void
  onLocationFound: (lat: number, lng: number, address: string) => void
  existingPhotos?: string[]
}

// ── Google Maps link parser ──
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

// ── Detect iPhone/iPad ──
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
}

// ── Reverse geocode ──
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
    const data = await res.json() as { display_name?: string }
    return data.display_name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

export default function SmartPhotoLocation({ onPhotosChanged, onLocationFound, existingPhotos = [] }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos,      setPhotos]      = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingPhotos)
  const [gpsStatus,   setGpsStatus]   = useState<'idle' | 'reading' | 'success' | 'failed'>('idle')
  const [gpsAddress,  setGpsAddress]  = useState('')
  const [pasteLink,   setPasteLink]   = useState('')
  const [linkError,   setLinkError]   = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const locationCaptured = useRef(false)

  const handleSuccess = useCallback(async (lat: number, lng: number) => {
    if (locationCaptured.current) return
    locationCaptured.current = true
    const addr = await reverseGeocode(lat, lng)
    setGpsAddress(addr.length > 80 ? addr.substring(0, 80) + '...' : addr)
    setGpsStatus('success')
    onLocationFound(lat, lng, addr)
  }, [onLocationFound])

  // ── Android path: read EXIF in browser ──
  const readExifInBrowser = async (file: File): Promise<boolean> => {
    try {
      const exifr = (await import('exifr')).default
      const gps = await exifr.gps(file)
      if (gps?.latitude && gps?.longitude) {
        await handleSuccess(gps.latitude, gps.longitude)
        return true
      }
    } catch { /* exifr not available */ }
    return false
  }

  // ── iPhone path: send photo to server, read EXIF there ──
  const readExifOnServer = async (file: File): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch('/api/extract-gps', { method: 'POST', body: formData })
      if (!res.ok) return false
      const data = await res.json() as { lat?: number; lng?: number }
      if (data.lat && data.lng) {
        await handleSuccess(data.lat, data.lng)
        return true
      }
    } catch { /* server read failed */ }
    return false
  }

  const handlePhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const newPhotos = [...photos, ...files]
    setPhotos(newPhotos)
    onPhotosChanged(newPhotos)

    const newUrls = files.map(f => URL.createObjectURL(f))
    setPreviewUrls(prev => [...prev, ...newUrls])

    // Only try GPS if not already captured
    if (!locationCaptured.current) {
      setGpsStatus('reading')
      const ios = isIOS()
      let found = false

      for (const file of files) {
        if (found) break
        if (ios) {
          // iPhone: server-side EXIF
          found = await readExifOnServer(file)
        } else {
          // Android: browser EXIF
          found = await readExifInBrowser(file)
          // If browser fails, also try server
          if (!found) found = await readExifOnServer(file)
        }
      }

      if (!found) setGpsStatus('failed')
    }

    // Reset input so same files can be selected again
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    const newUrls   = previewUrls.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setPreviewUrls(newUrls)
    onPhotosChanged(newPhotos)
  }

  const handleLinkParse = async () => {
    setLinkError('')
    setLinkLoading(true)
    const parsed = parseGoogleMapsLink(pasteLink.trim())
    if (!parsed) {
      setLinkError('Could not read coordinates. Make sure you copied the full Google Maps link.')
      setLinkLoading(false)
      return
    }
    await handleSuccess(parsed.lat, parsed.lng)
    setLinkLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hidden file input — no capture attribute so both camera and gallery work */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => void handlePhotosSelected(e)}
        style={{ display: 'none' }}
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '100%', padding: '18px 16px',
          background: '#1a6b4a', color: '#fff',
          border: 'none', borderRadius: 14,
          fontWeight: 700, fontSize: 16,
          cursor: 'pointer', textAlign: 'center',
          fontFamily: 'inherit',
        }}
      >
        📸 Add property photos
        <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, opacity: 0.85 }}>
          GPS location is read automatically from your photos
        </div>
      </button>

      {/* iPhone one-time tip */}
      {isIOS() && gpsStatus === 'idle' && (
        <div style={{
          background: '#fffbeb', border: '1px solid #f59e0b',
          borderRadius: 12, padding: 12, fontSize: 13, color: '#92400e', lineHeight: 1.5,
        }}>
          📱 <strong>iPhone tip (one time only):</strong> Make sure camera location is on —
          Settings → Privacy &amp; Security → Location Services → Camera → While Using App.
          Then take photos at the property before uploading.
        </div>
      )}

      {/* Photo previews */}
      {previewUrls.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px' }}>
            {previewUrls.length} photo{previewUrls.length !== 1 ? 's' : ''}
            {previewUrls.length < 3 && (
              <span style={{ color: '#f59e0b' }}> — {3 - previewUrls.length} more recommended</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {previewUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  style={{
                    width: 80, height: 80, objectFit: 'cover',
                    borderRadius: 10, border: '1.5px solid #e5e7eb',
                  }}
                />
                {i < photos.length && (
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 22, height: 22, borderRadius: '50%',
                      background: '#ef4444', color: '#fff',
                      border: 'none', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      lineHeight: '1', fontFamily: 'inherit',
                    }}
                  >×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GPS status — reading */}
      {gpsStatus === 'reading' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fffbeb', border: '1px solid #f59e0b',
          borderRadius: 12, padding: 12,
        }}>
          <div style={{
            width: 18, height: 18, border: '2px solid #f59e0b',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spl_spin 0.8s linear infinite', flexShrink: 0,
          }} />
          <style>{`@keyframes spl_spin { to { transform: rotate(360deg) } }`}</style>
          <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            Reading location from photo...
          </span>
        </div>
      )}

      {/* GPS status — success */}
      {gpsStatus === 'success' && (
        <div style={{
          background: '#f0fdf4', border: '2px solid #1a6b4a',
          borderRadius: 12, padding: 12,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
          <div>
            <p style={{ fontWeight: 700, color: '#1a6b4a', margin: '0 0 2px', fontSize: 14 }}>
              Location verified automatically ✅
            </p>
            <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{gpsAddress}</p>
          </div>
        </div>
      )}

      {/* Fallback: Google Maps link paste */}
      {gpsStatus === 'failed' && (
        <div style={{
          background: '#fff', border: '1.5px solid #f59e0b',
          borderRadius: 14, padding: 16,
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: '0 0 4px' }}>
            📍 Set location manually
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>
            Your photos did not have location data. Follow these steps:<br />
            1. Open <strong>Google Maps</strong> on your phone<br />
            2. Find the property building<br />
            3. Press and hold until a red pin drops<br />
            4. Tap <strong>Share → Copy link</strong><br />
            5. Paste below
          </p>
          <textarea
            value={pasteLink}
            onChange={e => { setPasteLink(e.target.value); setLinkError('') }}
            placeholder="Paste Google Maps link here..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: linkError ? '2px solid #ef4444' : '1.5px solid #d1d5db',
              fontSize: 13, fontFamily: 'inherit', resize: 'none',
              outline: 'none', boxSizing: 'border-box', color: '#1a1a1a',
              background: '#f9fafb',
            }}
          />
          {linkError && (
            <p style={{ fontSize: 12, color: '#ef4444', margin: '4px 0 8px' }}>{linkError}</p>
          )}
          <button
            type="button"
            onClick={() => void handleLinkParse()}
            disabled={!pasteLink.trim() || linkLoading}
            style={{
              width: '100%', padding: '14px',
              background: pasteLink.trim() && !linkLoading ? '#1a6b4a' : '#9ca3af',
              color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 15,
              cursor: pasteLink.trim() ? 'pointer' : 'not-allowed',
              marginTop: 8, fontFamily: 'inherit',
            }}
          >
            {linkLoading ? 'Reading coordinates...' : 'Set location from link'}
          </button>
        </div>
      )}

      {/* Minimum photos hint */}
      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
        Minimum 3 photos · Entrance, living room, bedroom, kitchen
      </p>
    </div>
  )
}
