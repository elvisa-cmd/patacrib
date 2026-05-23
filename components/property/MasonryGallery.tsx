'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface MasonryGalleryProps {
  images:     string[]
  title:      string
  status:     string
  price?:     number
  priceType?: string
  estate?:    string | null
}

const ROOM_LABELS = [
  'Living Room', 'Master Bedroom', 'Kitchen', 'Bathroom',
  'Bedroom 2', 'Dining Area', 'Balcony', 'Exterior',
  'Compound', 'Corridor', 'Store', 'Garage',
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    available:   { label: 'Available',   color: '#1a6b4a' },
    taken:       { label: 'Rented',      color: '#2563eb' },
    maintenance: { label: 'Pending',     color: '#b45309' },
  }
  const { label, color } = map[status] ?? { label: status, color: '#b45309' }
  return (
    <span style={{
      background: color, color: '#fff', fontSize: '9px', fontWeight: 800,
      textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 9px',
    }}>
      {label}
    </span>
  )
}

export function MasonryGallery({ images, title, status, price, priceType, estate }: MasonryGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [imgLoaded,   setImgLoaded]   = useState<Record<number, boolean>>({})

  const isOpen = lightboxIdx !== null
  const prev   = useCallback(() => setLightboxIdx(i => i != null ? Math.max(0, i - 1) : null), [])
  const next   = useCallback(() => setLightboxIdx(i => i != null ? Math.min(images.length - 1, i + 1) : null), [images.length])
  const close  = useCallback(() => setLightboxIdx(null), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, prev, next, close])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const formatPrice = () => {
    if (!price) return null
    const per = priceType === 'month' ? '/mo' : priceType === 'year' ? '/yr' : '/day'
    return `KSh ${price >= 1000 ? `${Math.round(price / 1000)}K` : price.toLocaleString('en-KE')}${per}`
  }

  if (!images.length) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/7', maxHeight: '480px',
        background: '#0a0a0a', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
      }}>
        <span style={{ fontSize: '64px' }}>🏠</span>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          No photos yet
        </p>
      </div>
    )
  }

  const hero    = images[0]
  const rest    = images.slice(1)
  const leftCol = rest.filter((_, i) => i % 2 === 0)
  const rightCol = rest.filter((_, i) => i % 2 === 1)

  return (
    <div style={{ width: '100%', background: '#0a0a0a' }}>

      {/* ── Hero image ─────────────────────────────────────────────── */}
      <div
        onClick={() => setLightboxIdx(0)}
        style={{
          position: 'relative', width: '100%', aspectRatio: '16/7',
          maxHeight: '480px', overflow: 'hidden', cursor: 'zoom-in',
          background: '#111',
        }}
      >
        {/* Blurred bg */}
        <div style={{
          position: 'absolute', inset: 0, transform: 'scale(1.1)',
          backgroundImage: `url(${hero})`, backgroundSize: 'cover',
          backgroundPosition: 'center', filter: 'blur(20px)',
          opacity: 0.4,
        }} />

        <Image
          src={hero}
          alt={title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'contain', position: 'relative', zIndex: 1 }}
          onLoad={() => setImgLoaded(p => ({ ...p, 0: true }))}
        />

        {/* Bottom gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '96px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Top-left badges */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <StatusBadge status={status} />
          <span style={{
            background: 'rgba(26,107,74,0.9)', color: '#fff', fontSize: '9px',
            fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
            padding: '4px 9px', display: 'flex', alignItems: 'center', gap: '5px',
            backdropFilter: 'blur(6px)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'pulse 2s infinite' }} />
            GPS Verified
          </span>
        </div>

        {/* Bottom-left: estate + price */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10 }}>
          {estate && (
            <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', margin: 0 }}>
              {estate}
            </p>
          )}
          {price && (
            <p style={{ fontSize: '22px', color: '#fff', fontWeight: 700, margin: 0, lineHeight: 1 }}>
              {formatPrice()}
            </p>
          )}
        </div>

        {/* Bottom-right: photo count */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 10 }}>
            <span style={{
              background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)',
              fontSize: '11px', padding: '4px 10px', backdropFilter: 'blur(4px)',
            }}>
              📷 {images.length} photos
            </span>
          </div>
        )}
      </div>

      {/* ── Masonry grid (remaining images) ────────────────────────── */}
      {rest.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px',
          background: '#0a0a0a', padding: '3px 0 0 0',
        }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {leftCol.map((img, colIdx) => {
              const globalIdx = colIdx * 2 + 1
              const label = ROOM_LABELS[globalIdx] ?? `Photo ${globalIdx + 1}`
              return (
                <div
                  key={globalIdx}
                  onClick={() => setLightboxIdx(globalIdx)}
                  style={{
                    position: 'relative', overflow: 'hidden', cursor: 'zoom-in',
                    aspectRatio: colIdx % 3 === 0 ? '4/3' : colIdx % 3 === 1 ? '1/1' : '16/10',
                    background: '#111',
                  }}
                >
                  <Image
                    src={img}
                    alt={label}
                    fill
                    sizes="50vw"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    padding: '12px 8px 6px', zIndex: 2,
                  }}>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {rightCol.map((img, colIdx) => {
              const globalIdx = colIdx * 2 + 2
              const label = ROOM_LABELS[globalIdx] ?? `Photo ${globalIdx + 1}`
              return (
                <div
                  key={globalIdx}
                  onClick={() => setLightboxIdx(globalIdx)}
                  style={{
                    position: 'relative', overflow: 'hidden', cursor: 'zoom-in',
                    aspectRatio: colIdx % 3 === 0 ? '1/1' : colIdx % 3 === 1 ? '4/3' : '3/2',
                    background: '#111',
                  }}
                >
                  <Image
                    src={img}
                    alt={label}
                    fill
                    sizes="50vw"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    padding: '12px 8px 6px', zIndex: 2,
                  }}>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────── */}
      {isOpen && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.97)',
            display: 'flex', flexDirection: 'column',
          }}
          onClick={close}
        >
          {/* Stop propagation on inner content */}
          <div
            style={{ flex: 1, position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Blurred bg */}
            <div style={{
              position: 'absolute', inset: 0, transform: 'scale(1.1)',
              backgroundImage: `url(${images[lightboxIdx]})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(30px)', opacity: 0.2,
            }} />

            <Image
              src={images[lightboxIdx]}
              alt={`${title} — photo ${lightboxIdx + 1}`}
              fill
              sizes="100vw"
              style={{ objectFit: 'contain', zIndex: 1 }}
              priority
            />

            {/* Close */}
            <button
              onClick={close}
              aria-label="Close"
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                width: '40px', height: '40px',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              ×
            </button>

            {/* Counter */}
            <div style={{
              position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 10, textAlign: 'center',
            }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
                {title}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>
                {lightboxIdx + 1} / {images.length}
              </p>
            </div>

            {/* Left arrow */}
            {lightboxIdx > 0 && (
              <button
                onClick={prev}
                aria-label="Previous"
                style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 10, width: '48px', height: '48px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '24px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '10px',
                }}
              >
                ‹
              </button>
            )}

            {/* Right arrow */}
            {lightboxIdx < images.length - 1 && (
              <button
                onClick={next}
                aria-label="Next"
                style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 10, width: '48px', height: '48px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '24px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '10px',
                }}
              >
                ›
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          <div
            style={{
              flexShrink: 0, padding: '8px 16px', background: 'rgba(0,0,0,0.6)',
              display: 'flex', gap: '6px', overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i)}
                aria-label={`Photo ${i + 1}`}
                style={{
                  flexShrink: 0, width: '64px', height: '44px', position: 'relative',
                  overflow: 'hidden', cursor: 'pointer', padding: 0,
                  border: i === lightboxIdx ? '2px solid #fff' : '2px solid transparent',
                  opacity: i === lightboxIdx ? 1 : 0.35,
                  transition: 'all 0.2s',
                  borderRadius: '4px',
                  background: 'transparent',
                }}
              >
                <Image src={img} alt="" fill sizes="64px" style={{ objectFit: 'cover' }} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MasonryGallery
