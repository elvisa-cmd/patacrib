'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'
import Image from 'next/image'

const MAX_PHOTOS = 12

interface InFlight {
  id:      string
  preview: string
  file:    File
  status:  'uploading' | 'error'
  error:   string | null
  progress: number
}

interface PhotoUploadProps {
  urls:     string[]
  onAdd:    (url: string) => void
  onRemove: (url: string) => void
}

export default function PhotoUpload({ urls, onAdd, onRemove }: PhotoUploadProps) {
  const [inFlight, setInFlight] = useState<InFlight[]>([])
  const [dragging,  setDragging]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    const id      = Math.random().toString(36).slice(2)
    const preview = URL.createObjectURL(file)

    setInFlight(prev => [...prev, { id, preview, file, status: 'uploading', error: null, progress: 0 }])

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error((data.error as string) ?? 'Upload failed')
      onAdd(data.url as string)
      setInFlight(prev => prev.filter(f => f.id !== id))
      // Revoke blob URL after success
      URL.revokeObjectURL(preview)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setInFlight(prev =>
        prev.map(f => f.id === id ? { ...f, status: 'error', error: msg } : f)
      )
    }
  }, [onAdd])

  const retryUpload = useCallback((item: InFlight) => {
    setInFlight(prev => prev.filter(f => f.id !== item.id))
    void uploadFile(item.file)
  }, [uploadFile])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const remaining = MAX_PHOTOS - urls.length - inFlight.filter(f => f.status === 'uploading').length
    const toUpload  = Array.from(files).slice(0, Math.max(0, remaining))
    toUpload.forEach(f => void uploadFile(f))
  }, [uploadFile, urls.length, inFlight])

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const uploading = inFlight.filter(f => f.status === 'uploading').length
  const errors    = inFlight.filter(f => f.status === 'error').length
  const total     = urls.length + uploading
  const atMax     = total >= MAX_PHOTOS

  return (
    <div>
      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      {!atMax && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed flex flex-col items-center justify-center py-10 cursor-pointer transition-colors rounded-sm ${
            dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-border2 hover:bg-surface2'
          }`}
        >
          <span className="text-4xl mb-3" aria-hidden="true">📷</span>
          <p className="font-sans font-bold text-[14px] text-ink">
            {urls.length === 0 ? 'Drop photos here or tap to browse' : 'Add more photos'}
          </p>
          <p className="font-sans text-[11px] text-muted mt-1">
            JPEG · PNG · WebP · Max 10 MB each · Up to {MAX_PHOTOS} photos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {atMax && (
        <div style={{ padding: '10px 14px', background: 'rgba(26,107,74,0.06)', borderRadius: '6px', fontSize: '12px', color: '#1a6b4a', fontWeight: 600 }}>
          ✓ Maximum {MAX_PHOTOS} photos reached
        </div>
      )}

      {/* ── Status bar ────────────────────────────────────────────────── */}
      {(total > 0 || errors > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f0e0c' }}>
            {urls.length} photo{urls.length !== 1 ? 's' : ''} added
          </span>
          {uploading > 0 && (
            <span style={{ fontSize: '11px', color: '#1a6b4a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', border: '2px solid #1a6b4a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Uploading {uploading}…
            </span>
          )}
          {errors > 0 && (
            <span style={{ fontSize: '11px', color: '#dc2626' }}>
              ⚠ {errors} failed
            </span>
          )}
        </div>
      )}

      {/* ── Photo grid ────────────────────────────────────────────────── */}
      {(urls.length > 0 || inFlight.length > 0) && (
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 '8px',
            marginTop:           '8px',
          }}
        >
          {/* Uploaded photos */}
          {urls.map((url, i) => (
            <div
              key={url}
              style={{
                position:     'relative',
                borderRadius: '6px',
                overflow:     'hidden',
                aspectRatio:  '4/3',
                background:   '#f0ece8',
                border:       i === 0 ? '2px solid #1a6b4a' : '1px solid #e8e2db',
                boxShadow:    i === 0 ? '0 0 0 2px rgba(26,107,74,0.15)' : 'none',
              }}
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 200px"
              />

              {/* Cover badge */}
              {i === 0 && (
                <span style={{
                  position:   'absolute',
                  bottom:     '6px',
                  left:       '6px',
                  background: '#1a6b4a',
                  color:      '#fff',
                  fontSize:   '9px',
                  fontWeight: 700,
                  padding:    '2px 6px',
                  borderRadius: '3px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  Cover
                </span>
              )}

              {/* Number badge */}
              {i > 0 && (
                <span style={{
                  position:   'absolute',
                  bottom:     '6px',
                  left:       '6px',
                  background: 'rgba(0,0,0,0.55)',
                  color:      '#fff',
                  fontSize:   '10px',
                  fontWeight: 600,
                  padding:    '2px 6px',
                  borderRadius: '3px',
                }}>
                  {i + 1}
                </span>
              )}

              {/* Remove button — always visible */}
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Remove photo"
                style={{
                  position:   'absolute',
                  top:        '5px',
                  right:      '5px',
                  width:      '22px',
                  height:     '22px',
                  background: 'rgba(0,0,0,0.65)',
                  border:     'none',
                  borderRadius: '50%',
                  color:      '#fff',
                  fontSize:   '14px',
                  lineHeight: '1',
                  cursor:     'pointer',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* In-flight (uploading / error) */}
          {inFlight.map(f => (
            <div
              key={f.id}
              style={{
                position:     'relative',
                borderRadius: '6px',
                overflow:     'hidden',
                aspectRatio:  '4/3',
                background:   '#f0ece8',
                border:       '1px solid #e8e2db',
              }}
            >
              <Image
                src={f.preview}
                alt="Uploading"
                fill
                className="object-cover"
                style={{ opacity: f.status === 'error' ? 0.35 : 0.55 }}
                sizes="200px"
              />

              {/* Uploading spinner */}
              {f.status === 'uploading' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.25)',
                }}>
                  <div style={{
                    width: '28px', height: '28px',
                    border: '3px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                </div>
              )}

              {/* Error state */}
              {f.status === 'error' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(220,38,38,0.18)',
                  padding: '8px',
                  gap: '6px',
                }}>
                  <span style={{ fontSize: '11px', color: '#fff', textAlign: 'center', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    Upload failed
                  </span>
                  <button
                    type="button"
                    onClick={() => retryUpload(f)}
                    style={{
                      background: '#dc2626', color: '#fff',
                      border: 'none', borderRadius: '4px',
                      padding: '3px 10px', fontSize: '11px',
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Dismiss failed */}
              {f.status === 'error' && (
                <button
                  type="button"
                  onClick={() => setInFlight(prev => prev.filter(x => x.id !== f.id))}
                  aria-label="Dismiss"
                  style={{
                    position: 'absolute', top: '5px', right: '5px',
                    width: '20px', height: '20px',
                    background: 'rgba(0,0,0,0.5)', border: 'none',
                    borderRadius: '50%', color: '#fff',
                    fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* First-photo hint */}
      {urls.length >= 1 && (
        <p style={{ fontSize: '10px', color: '#9b8e84', marginTop: '6px' }}>
          First photo is the cover · tap × to remove · add up to {MAX_PHOTOS} photos total
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
