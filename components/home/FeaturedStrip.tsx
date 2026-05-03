'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import PropertyCard from '@/components/shared/PropertyCard'
import { useCarousel } from '@/lib/hooks/useCarousel'
import type { SerializedProperty } from '@/types/property'

interface FeaturedStripProps {
  properties: SerializedProperty[]
}

function stepPx(container: HTMLElement) {
  return (container.offsetWidth - 32) / 3 + 16
}

export default function FeaturedStrip({ properties }: FeaturedStripProps) {
  const { current, goTo, next, prev, isPaused, setIsPaused, totalSlides } =
    useCarousel(properties.length)

  const trackRef    = useRef<HTMLDivElement>(null)
  const dragStartX  = useRef(0)
  const isDragging  = useRef(false)
  const touchStartX = useRef(0)

  // Apply transform whenever current changes
  useEffect(() => {
    const track = trackRef.current
    if (!track?.parentElement) return
    track.style.transform = `translateX(-${current * stepPx(track.parentElement)}px)`
  }, [current])

  // Recalculate on resize without changing slide
  useEffect(() => {
    const onResize = () => {
      const track = trackRef.current
      if (!track?.parentElement) return
      track.style.transform = `translateX(-${current * stepPx(track.parentElement)}px)`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [current])

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current  = true
    dragStartX.current  = e.clientX
    if (trackRef.current) trackRef.current.style.transition = 'none'
  }

  function finishDrag(endX: number) {
    if (!isDragging.current) return
    isDragging.current = false
    const track = trackRef.current
    if (track) track.style.transition = 'transform 0.55s cubic-bezier(0.77,0,0.175,1)'
    const diff = dragStartX.current - endX
    if (Math.abs(diff) > 80) {
      diff > 0 ? next() : prev()
    } else if (track?.parentElement) {
      track.style.transform = `translateX(-${current * stepPx(track.parentElement)}px)`
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

  const canNav = totalSlides > 1

  return (
    <section
      className="bg-white border-t border-b border-border"
      style={{ padding: '60px 64px 56px' }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">

        {/* Left — eyebrow + title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-6 h-px bg-accent" />
            <p className="font-sans font-semibold text-[9px] uppercase tracking-[1.5px] text-accent">
              Featured listings
            </p>
          </div>
          <h2 className="font-serif text-[36px] leading-none text-ink">
            Latest in <em>Nairobi</em>
          </h2>
        </div>

        {/* Right — counter + arrows + link */}
        <div className="flex items-center gap-4">
          <p className="font-serif text-[14px] text-muted whitespace-nowrap">
            <span className="text-[18px] text-ink">{current + 1}</span>{' '}of {totalSlides}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={!canNav || current === 0}
              aria-label="Previous slide"
              className="w-10 h-10 border-[1.5px] border-border2 bg-white text-muted flex items-center justify-center hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:pointer-events-none font-sans text-[16px]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNav || current === totalSlides - 1}
              aria-label="Next slide"
              className="w-10 h-10 border-[1.5px] border-border2 bg-white text-muted flex items-center justify-center hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:pointer-events-none font-sans text-[16px]"
            >
              →
            </button>
          </div>

          <Link
            href="/browse"
            className="font-sans text-[12px] text-muted hover:text-ink transition-colors"
          >
            All listings →
          </Link>
        </div>
      </div>

      {/* ── Carousel track ──────────────────────────────────── */}
      <div
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={e => { setIsPaused(false); finishDrag(e.clientX) }}
      >
        <div
          ref={trackRef}
          className="flex select-none"
          style={{
            gap:        '16px',
            padding:    '0 0 8px',
            transition: 'transform 0.55s cubic-bezier(0.77, 0, 0.175, 1)',
            willChange: 'transform',
          }}
          onMouseDown={onMouseDown}
          onMouseUp={e => finishDrag(e.clientX)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {properties.map(p => (
            <div key={p.id} style={{ flex: '0 0 calc(33.333% - 11px)' }}>
              <PropertyCard property={p} mode="grid" showSave />
            </div>
          ))}
        </div>
      </div>

      {/* ── Dot indicators ──────────────────────────────────── */}
      {canNav && (
        <div className="flex justify-center gap-1.5 mt-[26px]">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width:        i === current ? '24px' : '5px',
                height:       '5px',
                borderRadius: i === current ? '3px' : '50%',
                background:   i === current ? '#0f0e0c' : 'rgba(15,14,12,0.13)',
                transition:   'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                cursor:       'pointer',
                border:       'none',
                padding:      0,
                flexShrink:   0,
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
