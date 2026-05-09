'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images:     string[]
  title:      string
  status:     string
  price?:     number
  priceType?: string
  estate?:    string | null
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

export function ImageGallery({
  images,
  title,
  status,
  price,
  priceType,
  estate,
}: ImageGalleryProps) {
  const [activeIdx,  setActiveIdx]  = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [copied,     setCopied]     = useState(false)

  const hasImages = images.length > 0
  const thumbs    = images.slice(0, 8)
  const extra     = images.length - 8

  const prev = useCallback(() => setActiveIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setActiveIdx(i => Math.min(images.length - 1, i + 1)), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const formatPrice = () => {
    if (!price) return null
    const per = priceType === 'month' ? '/mo' : priceType === 'year' ? '/yr' : '/day'
    return `KSh ${price >= 1000 ? `${Math.round(price / 1000)}K` : price.toLocaleString('en-KE')}${per}`
  }

  return (
    <div className="w-full">
      {/* ── Main cinematic area ─────────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden bg-[#0a0a0a]"
        style={{ aspectRatio: '16/7', maxHeight: '540px' }}
      >
        {hasImages ? (
          <>
            {/* Blurred background layer */}
            <div
              className="absolute inset-0 scale-110 blur-2xl opacity-50 transition-all duration-500"
              style={{
                backgroundImage:    `url(${images[activeIdx]})`,
                backgroundSize:     'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Main image — object-contain to show full photo */}
            <Image
              src={images[activeIdx]}
              alt={title}
              fill
              className="object-contain relative z-10 transition-opacity duration-500"
              sizes="100vw"
              priority
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="text-[64px]" aria-hidden="true">🏠</span>
            <p className="font-sans text-[12px] text-white/40 uppercase tracking-[1px]">No photos yet</p>
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Top-left: status + GPS badge */}
        <div className="absolute top-4 left-5 z-30 flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="bg-accent/90 backdrop-blur-sm text-white font-sans font-bold text-[9px] uppercase tracking-[1px] px-2.5 py-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
            GPS Verified
          </span>
        </div>

        {/* Top-right: share + expand */}
        <div className="absolute top-4 right-5 z-30 flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Copy link to clipboard"
            className="w-8 h-8 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center font-sans text-[13px] text-white/80 hover:text-white hover:bg-black/60 transition-colors"
          >
            {copied ? '✓' : '↗'}
          </button>
          {hasImages && (
            <button
              onClick={() => setFullscreen(true)}
              aria-label="View fullscreen"
              className="w-8 h-8 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center font-sans text-[13px] text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            >
              ⤢
            </button>
          )}
        </div>

        {/* Bottom-left: estate + price */}
        {(estate || price) && (
          <div className="absolute bottom-4 left-5 z-30">
            {estate && (
              <p className="font-sans text-[9px] uppercase tracking-[1.5px] text-white/60 mb-0.5">{estate}</p>
            )}
            {price && (
              <p className="font-serif text-[20px] text-white leading-none">{formatPrice()}</p>
            )}
          </div>
        )}

        {/* Bottom-right: counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-5 z-30">
            <span className="font-sans text-[11px] text-white/70 bg-black/40 backdrop-blur-sm px-2.5 py-1">
              {activeIdx + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Left arrow */}
        {images.length > 1 && activeIdx > 0 && (
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors text-[20px] font-light"
          >
            ‹
          </button>
        )}

        {/* Right arrow */}
        {images.length > 1 && activeIdx < images.length - 1 && (
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors text-[20px] font-light"
          >
            ›
          </button>
        )}
      </div>

      {/* ── Thumbnail strip ─────────────────────────────────────────────── */}
      {images.length > 1 && (
        <div className="flex gap-1 px-5 py-2 bg-[#111] overflow-x-auto scrollbar-none">
          {thumbs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`View photo ${i + 1}`}
              className={`flex-shrink-0 w-[72px] h-[48px] relative overflow-hidden border-2 transition-all duration-200 ${
                activeIdx === i
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <Image
                src={img}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="72px"
                loading="lazy"
              />
            </button>
          ))}
          {extra > 0 && (
            <button
              onClick={() => setFullscreen(true)}
              className="flex-shrink-0 w-[72px] h-[48px] bg-white/10 border border-white/10 flex items-center justify-center"
            >
              <span className="font-sans text-[10px] text-white/60">+{extra}</span>
            </button>
          )}
        </div>
      )}

      {/* ── Fullscreen overlay ──────────────────────────────────────────── */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery fullscreen"
        >
          {/* Blur background */}
          <div
            className="absolute inset-0 blur-3xl opacity-25 scale-110 transition-all duration-500"
            style={{
              backgroundImage:    `url(${images[activeIdx]})`,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Full image */}
          <div className="relative w-full h-full z-10">
            <Image
              src={images[activeIdx]}
              alt={title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Close */}
          <button
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen"
            className="absolute top-5 right-5 z-20 w-10 h-10 bg-white/10 border border-white/10 text-white text-xl flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ×
          </button>

          {/* Counter + title */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-center">
            <p className="font-sans text-[11px] text-white/50 uppercase tracking-[1.5px]">{title}</p>
            <p className="font-sans text-[12px] text-white/70 mt-0.5">{activeIdx + 1} / {images.length}</p>
          </div>

          {/* Left arrow */}
          {activeIdx > 0 && (
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 border border-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              ‹
            </button>
          )}

          {/* Right arrow */}
          {activeIdx < images.length - 1 && (
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 border border-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              ›
            </button>
          )}

          {/* Dot indicators */}
          {images.length <= 12 && (
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  className={`rounded-full transition-all duration-200 ${
                    i === activeIdx
                      ? 'w-5 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Thumbnail strip in fullscreen */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-1 px-6 pb-16 pt-2 overflow-x-auto scrollbar-none">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`flex-shrink-0 w-16 h-10 relative overflow-hidden border transition-all ${
                    activeIdx === i ? 'border-white opacity-100' : 'border-white/10 opacity-30 hover:opacity-60'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
