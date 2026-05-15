'use client'

import { useState, useEffect, useRef } from 'react'
import Link                             from 'next/link'
import type { SerializedProperty }      from '@/types/property'

interface Props {
  properties: SerializedProperty[]
  dbError?:   boolean
}

const BG_COLORS = [
  'linear-gradient(160deg,#1a3a2a,#2d6b4a)',
  'linear-gradient(160deg,#1a2a3a,#2d4a6b)',
  'linear-gradient(160deg,#3a2a1a,#6b4a2d)',
  'linear-gradient(160deg,#2a1a3a,#4a2d6b)',
  'linear-gradient(160deg,#1a3a3a,#2d6b6b)',
]

const ICONS: Record<string, string> = {
  apartment:  '🏢',
  flat:       '🏢',
  studio:     '🏢',
  bedsitter:  '🏢',
  house:      '🏠',
  bungalow:   '🏠',
  maisonette: '🏡',
  townhouse:  '🏡',
  commercial: '🏬',
  office:     '🏬',
  villa:      '🏰',
  default:    '🏠',
}

function getIcon(type?: string | null) {
  if (!type) return ICONS.default
  const t = type.toLowerCase()
  for (const key of Object.keys(ICONS)) {
    if (t.includes(key)) return ICONS[key]
  }
  return ICONS.default
}

export default function HeroSlider({ properties, dbError }: Props) {
  const [current,  setCurrent]  = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)
  const timerRef  = useRef<ReturnType<typeof setInterval>>()

  const total = properties.length

  function goTo(n: number) {
    setCurrent(((n % total) + total) % total)
  }
  function next() { goTo(current + 1) }
  function prev() { goTo(current - 1) }

  useEffect(() => {
    timerRef.current = setInterval(next, 4000)
    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, total])

  function handleDragStart(x: number) {
    startXRef.current = x
    setDragging(true)
    clearInterval(timerRef.current)
  }

  function handleDragEnd(x: number) {
    if (!dragging) return
    setDragging(false)
    const diff = startXRef.current - x
    if (diff > 50) next()
    else if (diff < -50) prev()
  }

  if (!properties || properties.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#b0a898', fontSize: '14px' }}>
        {dbError ? 'Could not load listings — please refresh' : 'No listings available yet'}
      </div>
    )
  }

  const p = properties[current]

  const hasTour = !!(p.videoUrl || p.tourImageUrl)

  const chips = [
    p.bedrooms > 0 ? `${p.bedrooms} bed${p.bedrooms > 1 ? 's' : ''}` : null,
    p.matatuRoutes.length > 0 ? `Route ${p.matatuRoutes[0]}` : null,
    p.waterSchedule ? 'Water daily' : null,
    p.powerBackup   ? 'Generator'   : null,
    hasTour         ? '360° tour'   : null,
  ].filter(Boolean).slice(0, 4) as string[]

  const location = [p.estate, p.city].filter(Boolean).join(', ') || p.address

  // CBD placeholder coordinates = not GPS-verified
  const isGpsVerified =
    !(Math.abs(p.latitude - (-1.286389)) < 0.001 && Math.abs(p.longitude - 36.817223) < 0.001)

  return (
    <>
    <style>{`
      @keyframes kenburns {
        0%   { transform: scale(1.08); }
        100% { transform: scale(1);    }
      }
      @keyframes slideUp {
        0%   { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0);    }
      }
      @keyframes progress {
        0%   { width: 0%;    }
        100% { width: 100%;  }
      }
    `}</style>
    <div
      style={{
        position:   'relative',
        width:      '100%',
        height:     '520px',
        overflow:   'hidden',
        userSelect: 'none',
      }}
      onMouseDown={e => handleDragStart(e.clientX)}
      onMouseUp={e => handleDragEnd(e.clientX)}
      onMouseLeave={() => setDragging(false)}
      onTouchStart={e => handleDragStart(e.touches[0].clientX)}
      onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
    >
      {/* ── Slides ─────────────────────────────────────────────────────────── */}
      {properties.map((prop, i) => {
        const isActive = i === current
        const isPrev   = i === (current - 1 + total) % total
        return (
          <div
            key={prop.id}
            style={{
              position:   'absolute',
              inset:      0,
              opacity:    isActive ? 1 : 0,
              transform:  isActive ? 'translateX(0%) scale(1)'
                        : isPrev  ? 'translateX(-100%) scale(0.95)'
                        :           'translateX(100%) scale(0.95)',
              transition: dragging ? 'none' : 'all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
              zIndex:     isActive ? 2 : 1,
            }}
          >
            {prop.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={prop.images[0]}
                alt={prop.title}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  animation: isActive ? 'kenburns 6s ease-out forwards' : 'none',
                  transform: isActive ? undefined : 'scale(1.05)',
                }}
                draggable={false}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: BG_COLORS[i % BG_COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '80px',
                animation: isActive ? 'kenburns 6s ease-out forwards' : 'none',
              }}>
                {getIcon(prop.propertyType)}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div style={{
        position:      'absolute',
        inset:         0,
        background:    'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.28) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── Counter ──────────────────────────────────────────────────────── */}
      <div style={{
        position:    'absolute',
        top:         '16px',
        left:        '50%',
        transform:   'translateX(-50%)',
        background:  'rgba(0,0,0,0.4)',
        border:      '1px solid rgba(255,255,255,0.2)',
        color:       '#fff',
        fontSize:    '11px',
        fontWeight:  600,
        padding:     '3px 10px',
        borderRadius:'20px',
        zIndex:      5,
        fontFamily:  'inherit',
      }}>
        {current + 1} / {total}
      </div>

      {/* ── Bottom info ──────────────────────────────────────────────────── */}
      <div
        key={`info-${current}`}
        style={{
          position:  'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          padding:    '20px 16px',
          zIndex:     5,
          fontFamily: 'inherit',
          animation: 'slideUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        }}
      >
        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '14px' }}>
          {properties.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                height:       '3px',
                width:        i === current ? '20px' : '6px',
                borderRadius: '2px',
                background:   i === current ? '#4dbe87' : 'rgba(255,255,255,0.4)',
                border:       'none',
                cursor:       'pointer',
                padding:      0,
                transition:   'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          height: '2px', background: 'rgba(255,255,255,0.2)',
          borderRadius: '1px', marginBottom: '12px', overflow: 'hidden',
        }}>
          <div
            key={`progress-${current}`}
            style={{
              height: '100%', background: '#4dbe87',
              borderRadius: '1px',
              animation: 'progress 4s linear forwards',
            }}
          />
        </div>

        {/* Price */}
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.8px', lineHeight: 1, marginBottom: '6px' }}>
          KSh {p.price.toLocaleString('en-KE')}
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.7)', marginLeft: '4px' }}>/mo</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '4px', letterSpacing: '-0.3px' }}>
          {p.title}
        </div>

        {/* Location */}
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📍</span>
          {location}
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {isGpsVerified && (
            <span style={{
              background:  'rgba(77,190,135,0.25)',
              border:      '1px solid rgba(77,190,135,0.4)',
              color:       '#4dbe87',
              fontSize:    '11px',
              fontWeight:  600,
              padding:     '4px 10px',
              borderRadius:'20px',
            }}>
              GPS verified
            </span>
          )}
          {chips.map(c => (
            <span key={c} style={{
              background:  'rgba(255,255,255,0.15)',
              border:      '1px solid rgba(255,255,255,0.25)',
              color:       '#fff',
              fontSize:    '11px',
              fontWeight:  500,
              padding:     '4px 10px',
              borderRadius:'20px',
            }}>
              {c}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            href={`/property/${p.id}`}
            style={{
              flex:           1,
              background:     '#fff',
              color:          '#0f0e0c',
              padding:        '13px',
              borderRadius:   '14px',
              fontSize:       '14px',
              fontWeight:     700,
              textAlign:      'center',
              textDecoration: 'none',
              display:        'block',
            }}
          >
            View property
          </Link>
          <Link
            href={`/property/${p.id}#directions`}
            style={{
              flex:           1,
              background:     '#1a6b4a',
              color:          '#fff',
              padding:        '13px',
              borderRadius:   '14px',
              fontSize:       '14px',
              fontWeight:     600,
              textAlign:      'center',
              textDecoration: 'none',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '6px',
            }}
          >
            🗺 Directions
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
