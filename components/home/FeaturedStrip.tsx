'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import PropertyCard from '@/components/shared/PropertyCard'
import { useCarousel } from '@/lib/hooks/useCarousel'
import type { SerializedProperty } from '@/types/property'

interface FeaturedStripProps {
  properties: SerializedProperty[]
  dbError?:   boolean
}

function stepPx(container: HTMLElement, n: number) {
  const gap = 16
  return (container.offsetWidth + gap) / n
}

export default function FeaturedStrip({ properties, dbError }: FeaturedStripProps) {
  const [visibleCards, setVisibleCards] = useState(3)
  const [activeIndex,  setActiveIndex]  = useState(0)
  const isMobile = visibleCards === 1

  useEffect(() => {
    const update = () => setVisibleCards(window.innerWidth < 768 ? 1 : 3)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { current, goTo, next, prev, setIsPaused, totalSlides } =
    useCarousel(properties.length, visibleCards)

  const trackRef    = useRef<HTMLDivElement>(null)
  const dragStartX  = useRef(0)
  const isDragging  = useRef(false)
  const touchStartX = useRef(0)
  const goToRef     = useRef(goTo)
  useEffect(() => { goToRef.current = goTo })

  // Sync desktop carousel track with activeIndex
  useEffect(() => {
    if (!isMobile) goToRef.current(Math.floor(activeIndex / visibleCards))
  }, [activeIndex, visibleCards, isMobile])

  // Auto-advance every 3 s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev === properties.length - 1 ? 0 : prev + 1))
    }, 3000)
    return () => clearInterval(interval)
  }, [properties.length])

  // Apply CSS transform (desktop only)
  useEffect(() => {
    if (isMobile) return
    const track = trackRef.current
    if (!track?.parentElement) return
    track.style.transform = `translateX(-${current * stepPx(track.parentElement, visibleCards)}px)`
  }, [current, visibleCards, isMobile])

  useEffect(() => {
    if (isMobile) return
    const onResize = () => {
      const track = trackRef.current
      if (!track?.parentElement) return
      track.style.transform = `translateX(-${current * stepPx(track.parentElement, visibleCards)}px)`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [current, visibleCards, isMobile])

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true
    dragStartX.current = e.clientX
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
      track.style.transform = `translateX(-${current * stepPx(track.parentElement, visibleCards)}px)`
    }
  }

  const showControls = !isMobile && properties.length > 3

  return (
    <section className="bg-white border-t border-b border-border px-4 md:px-16 pt-10 md:pt-[60px] pb-9 md:pb-[56px]">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-6 h-px bg-accent" />
            <p className="font-sans font-semibold text-[9px] uppercase tracking-[1.5px] text-accent">
              Featured listings
            </p>
          </div>
          <h2 className="font-serif text-[36px] leading-none text-ink">
            Latest listings
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {showControls && (
            <p className="font-serif text-[14px] text-muted whitespace-nowrap">
              <span className="text-[18px] text-ink">{current + 1}</span>{' '}of {totalSlides}
            </p>
          )}
          {showControls && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={current === 0}
                aria-label="Previous slide"
                className="w-10 h-10 border-[1.5px] border-border2 bg-white text-muted flex items-center justify-center hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:pointer-events-none font-sans text-[16px]"
              >←</button>
              <button
                type="button"
                onClick={next}
                disabled={current === totalSlides - 1}
                aria-label="Next slide"
                className="w-10 h-10 border-[1.5px] border-border2 bg-white text-muted flex items-center justify-center hover:border-ink hover:text-ink transition-colors disabled:opacity-25 disabled:pointer-events-none font-sans text-[16px]"
              >→</button>
            </div>
          )}
          <Link href="/browse" className="font-sans text-[12px] text-muted hover:text-ink transition-colors">
            All listings →
          </Link>
        </div>
      </div>

      {/* ── Carousel ──────────────────────────────────────────── */}
      {properties.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#b0a898', padding: '40px 16px', fontSize: '14px' }}>
          {dbError ? 'Could not load listings — please refresh' : 'No listings available yet'}
        </p>
      ) : isMobile ? (

        /* ── MOBILE: native scroll-snap, escapes section px-4 ── */
        <div className="-mx-4">
          <div
            style={{
              display:                 'flex',
              gap:                     '16px',
              overflowX:               'auto',
              scrollSnapType:          'x mandatory',
              WebkitOverflowScrolling: 'touch',
              paddingLeft:             '16px',
              paddingRight:            '16px',
              paddingBottom:           '12px',
              scrollbarWidth:          'none',
            }}
          >
            {properties.map(p => (
              <div
                key={p.id}
                style={{
                  minWidth:      'min(280px, 85vw)',
                  maxWidth:      'min(280px, 85vw)',
                  flexShrink:    0,
                  scrollSnapAlign: 'start',
                }}
              >
                <PropertyCard property={p} mode="grid" showSave />
              </div>
            ))}
          </div>
        </div>

      ) : (

        /* ── DESKTOP: transform-based with spring scale animation ── */
        <div
          style={{ overflowX: 'clip', overflowY: 'visible' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={e => { setIsPaused(false); finishDrag(e.clientX) }}
        >
          <div
            ref={trackRef}
            className="flex select-none"
            style={{
              gap:        '16px',
              padding:    '12px 0 16px',
              transition: 'transform 0.55s cubic-bezier(0.77, 0, 0.175, 1)',
              willChange: 'transform',
            }}
            onMouseDown={onMouseDown}
            onMouseUp={e => finishDrag(e.clientX)}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              const diff = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
            }}
          >
            {properties.map((p, index) => (
              <motion.div
                key={p.id}
                animate={{
                  scale:   activeIndex === index ? 1.05 : 0.92,
                  opacity: activeIndex === index ? 1 : 0.7,
                  y:       activeIndex === index ? -8 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.4 }}
                whileHover={{
                  scale:   activeIndex === index ? 1.07 : 0.96,
                  opacity: 1,
                }}
                onClick={() => setActiveIndex(index)}
                style={{
                  flex:            `0 0 calc(${100 / visibleCards}% - ${16 * (visibleCards - 1) / visibleCards}px)`,
                  cursor:          'pointer',
                  transformOrigin: 'center bottom',
                }}
              >
                <PropertyCard property={p} mode="grid" showSave />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dot indicators ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
        {properties.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to property ${i + 1}`}
            onClick={() => setActiveIndex(i)}
            style={{
              width:        i === activeIndex ? '24px' : '6px',
              height:       '6px',
              borderRadius: '3px',
              background:   i === activeIndex ? '#1a6b4a' : 'rgba(0,0,0,0.15)',
              border:       'none',
              cursor:       'pointer',
              padding:      0,
              transition:   'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  )
}
