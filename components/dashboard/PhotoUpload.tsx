'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'
import Image from 'next/image'

interface InFlight {
  id:      string
  preview: string
  status:  'uploading' | 'error'
  error:   string | null
}

interface PhotoUploadProps {
  urls:     string[]
  onAdd:    (url: string) => void
  onRemove: (url: string) => void
}

export default function PhotoUpload({ urls, onAdd, onRemove }: PhotoUploadProps) {
  const [inFlight, setInFlight] = useState<InFlight[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    const id      = Math.random().toString(36).slice(2)
    const preview = URL.createObjectURL(file)

    setInFlight(prev => [...prev, { id, preview, status: 'uploading', error: null }])

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error((data.error as string) ?? 'Upload failed')
      onAdd(data.url as string)
      setInFlight(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setInFlight(prev =>
        prev.map(f => f.id === id ? { ...f, status: 'error', error: msg } : f)
      )
    }
  }, [onAdd])

  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile)
  }, [uploadFile])

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const activeUploads = inFlight.filter(f => f.status === 'uploading').length
  const total         = urls.length + activeUploads

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed flex flex-col items-center justify-center py-10 cursor-pointer transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-border2'
        }`}
      >
        <span className="text-3xl mb-2" aria-hidden="true">📷</span>
        <p className="font-sans font-semibold text-[13px] text-ink">
          Drop photos here or click to browse
        </p>
        <p className="font-sans text-[11px] text-muted mt-0.5">JPEG · PNG · WebP · Max 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* Thumbnail grid */}
      {(urls.length > 0 || inFlight.length > 0) && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {urls.map((url, i) => (
            <div
              key={url}
              className="relative overflow-hidden border border-border group"
              style={{ aspectRatio: '1' }}
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 w-5 h-5 bg-red text-white text-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-accent text-white font-sans text-[8px] uppercase tracking-[0.5px] px-1.5 py-0.5">
                  Cover
                </span>
              )}
            </div>
          ))}

          {inFlight.map(f => (
            <div
              key={f.id}
              className="relative overflow-hidden border border-border"
              style={{ aspectRatio: '1' }}
            >
              <Image
                src={f.preview}
                alt="Uploading"
                fill
                className="object-cover opacity-60"
                sizes="120px"
              />
              {f.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red/20 p-1">
                  <span className="font-sans text-[9px] text-white text-center leading-tight">
                    {f.error}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <p className="font-sans text-[10px] text-muted mt-2">
          {total} photo{total !== 1 ? 's' : ''}
          {activeUploads > 0 ? ` · uploading ${activeUploads}…` : ''}
        </p>
      )}
    </div>
  )
}
