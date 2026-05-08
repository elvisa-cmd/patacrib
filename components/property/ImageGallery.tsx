'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images:     string[]
  title:      string
  status:     string
  propertyId: string
  isSaved:    boolean
  isLoggedIn: boolean
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'available') {
    return (
      <span className="bg-green text-white font-sans font-bold text-[9px] uppercase tracking-[1px] px-2.5 py-1">
        Available
      </span>
    )
  }
  if (status === 'taken') {
    return (
      <span className="bg-blue text-white font-sans font-bold text-[9px] uppercase tracking-[1px] px-2.5 py-1">
        Rented
      </span>
    )
  }
  return (
    <span className="bg-gold text-white font-sans font-bold text-[9px] uppercase tracking-[1px] px-2.5 py-1">
      Pending
    </span>
  )
}

export default function ImageGallery({
  images,
  title,
  status,
  propertyId,
  isSaved: initialSaved,
  isLoggedIn,
}: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [saved,    setSaved]    = useState(initialSaved)
  const [saving,   setSaving]   = useState(false)
  const [copied,   setCopied]   = useState(false)

  const hasImages = images.length > 0
  const thumbs    = images.slice(0, 5)
  const extra     = images.length - 5

  const handleSave = async () => {
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setSaving(true)
    try {
      const res  = await fetch('/api/saved', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ propertyId }),
      })
      const data = await res.json()
      if (res.ok) setSaved(data.saved as boolean)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="w-full">
      {/* Main image — 16:9 aspect ratio, max 480px tall on desktop */}
      <div className="relative w-full bg-surface2 overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '480px' }}>
        {hasImages ? (
          <Image
            src={images[activeIdx]}
            alt={title}
            fill
            className="object-cover object-center transition-all duration-500"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="text-[64px]" aria-hidden="true">🏠</span>
            <p className="font-sans text-[12px] text-muted uppercase tracking-[1px]">
              No photos yet
            </p>
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="bg-accent text-white font-sans font-bold text-[9px] uppercase tracking-[1px] px-2.5 py-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
            GPS Verified
          </span>
        </div>

        {/* Top-right actions */}
        <div className="absolute top-4 right-6 flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Copy link to clipboard"
            className="w-9 h-9 bg-surface/90 backdrop-blur-sm border border-border flex items-center justify-center font-sans text-[13px] text-muted hover:text-ink transition-colors"
          >
            {copied ? '✓' : '↗'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label={saved ? 'Remove from saved' : 'Save this property'}
            className={`w-9 h-9 backdrop-blur-sm border flex items-center justify-center font-sans text-[14px] transition-colors ${
              saved
                ? 'bg-accent/90 border-accent text-white'
                : 'bg-surface/90 border-border text-muted hover:text-ink'
            }`}
          >
            {saved ? '♥' : '♡'}
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      {hasImages && (
        <div className="flex gap-2 px-6 py-3 bg-surface border-b border-border overflow-x-auto scrollbar-none">
          {thumbs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`View photo ${i + 1}`}
              className={`flex-shrink-0 w-20 h-14 relative overflow-hidden border-2 transition-all ${
                activeIdx === i
                  ? 'border-accent'
                  : 'border-transparent hover:border-border2'
              }`}
            >
              <Image
                src={img}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover object-center"
                sizes="80px"
                loading="lazy"
              />
            </button>
          ))}
          {extra > 0 && (
            <div className="flex-shrink-0 w-20 h-14 bg-surface2 border border-border flex items-center justify-center">
              <span className="font-sans font-semibold text-[10px] text-muted">
                +{extra}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
