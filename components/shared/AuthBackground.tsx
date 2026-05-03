'use client'

import { useState, useEffect, useRef } from 'react'

const HOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=60',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=60',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=60',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=60',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=60',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=60',
]

interface AuthBackgroundProps {
  children:      React.ReactNode
  className?:    string           // applied to the outer container
  contentClass?: string           // applied to the z-10 content wrapper
  style?:        React.CSSProperties
}

export default function AuthBackground({
  children,
  className    = '',
  contentClass = '',
  style,
}: AuthBackgroundProps) {
  const [currentImage,    setCurrentImage]    = useState(0)
  const [nextImage,       setNextImage]       = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>>()

  // Auto-advance slideshow
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true)
      timeoutRef.current = setTimeout(() => {
        setCurrentImage(prev => (prev + 1) % HOUSE_IMAGES.length)
        setIsTransitioning(false)
      }, 1000)
    }, 5000)
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Preload next image whenever current changes
  useEffect(() => {
    const next = (currentImage + 1) % HOUSE_IMAGES.length
    setNextImage(next)
    const img = new Image()
    img.src = HOUSE_IMAGES[next]
  }, [currentImage])

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ background: '#0a0f0a', ...style }}
    >

      {/* ── Layer 1: Slideshow images (z-0) ────────────── */}
      <div className="absolute inset-0 z-0">
        <img
          src={HOUSE_IMAGES[currentImage]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            opacity:    isTransitioning ? 0 : 0.12,
            transition: 'opacity 1s ease-in-out',
          }}
        />
        <img
          src={HOUSE_IMAGES[nextImage]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            opacity:    isTransitioning ? 0.12 : 0,
            transition: 'opacity 1s ease-in-out',
          }}
        />
      </div>

      {/* ── Layer 2: Dark base overlay (z-1) ────────────── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'rgba(10,15,10,0.75)' }}
      />

      {/* ── Layer 3: Mesh gradient (z-2) ────────────────── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 110% -10%, rgba(26,107,74,0.6) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at -10% 110%, rgba(200,240,100,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(26,107,74,0.1) 0%, transparent 70%)
          `,
        }}
      />

      {/* ── Layer 4: Grid dot pattern (z-3) ─────────────── */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Layer 5: Bottom fade (z-4) ──────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[4] pointer-events-none"
        style={{
          height:     '200px',
          background: 'linear-gradient(transparent, rgba(10,15,10,0.8))',
        }}
      />

      {/* ── Layer 6: Content (z-10) ─────────────────────── */}
      <div className={`relative z-10 h-full ${contentClass}`}>
        {children}
      </div>

    </div>
  )
}
