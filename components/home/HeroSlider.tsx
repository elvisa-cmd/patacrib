'use client'

import { useState, useEffect, useRef } from 'react'
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

  const location = [p.estate, p.city].filter(Boolean).join(', ') || p.address

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
    `}</style>
    <div style={{ padding: '0 12px', marginBottom: '8px' }}>

      {/* Slide container */}
      <div
        style={{
          height:     '200px',
          borderRadius: '20px',
          overflow:   'hidden',
          position:   'relative',
          background: '#0f1a12',
          userSelect: 'none',
        }}
        onMouseDown={e => handleDragStart(e.clientX)}
        onMouseUp={e => handleDragEnd(e.clientX)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={e => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
      >
        {/* Slides */}
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
                  fontSize: '60px',
                  animation: isActive ? 'kenburns 6s ease-out forwards' : 'none',
                }}>
                  {getIcon(prop.propertyType)}
                </div>
              )}
            </div>
          )
        })}

        {/* Overlay */}
        <div style={{
          position:      'absolute',
          inset:         0,
          background:    'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.28) 100%)',
          pointerEvents: 'none',
          zIndex:        3,
        }} />

        {/* Counter pill */}
        <div style={{
          position:    'absolute',
          top:         '12px',
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
          whiteSpace:  'nowrap',
        }}>
          {current + 1} / {total}
        </div>

        {/* Compact bottom info */}
        <div
          key={`info-${current}`}
          style={{
            position:  'absolute',
            bottom:     0,
            left:       0,
            right:      0,
            padding:    '10px 14px 14px',
            zIndex:     5,
            fontFamily: 'inherit',
            animation:  'slideUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
          }}
        >
          {/* Dot indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
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

          {/* Price + GPS chip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              KSh {p.price?.toLocaleString('en-KE')}
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}> /mo</span>
            </div>
            {isGpsVerified && (
              <div style={{
                background:   'rgba(77,190,135,0.25)',
                color:        '#4dbe87',
                fontSize:     '9px',
                fontWeight:   700,
                padding:      '2px 8px',
                borderRadius: '20px',
              }}>
                GPS ✓
              </div>
            )}
          </div>

          {/* Title · location */}
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
            {p.title} · {location}
          </div>
        </div>
      </div>

      {/* Action buttons below the card */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <a
          href={`/property/${p.id}`}
          style={{
            flex:           1,
            background:     '#0f0e0c',
            color:          '#fff',
            padding:        '12px',
            borderRadius:   '14px',
            fontSize:       '13px',
            fontWeight:     700,
            textAlign:      'center',
            textDecoration: 'none',
            display:        'block',
            fontFamily:     'inherit',
          }}
        >
          View property
        </a>
        <a
          href={`/property/${p.id}#directions`}
          style={{
            flex:           1,
            background:     '#1a6b4a',
            color:          '#fff',
            padding:        '12px',
            borderRadius:   '14px',
            fontSize:       '13px',
            fontWeight:     600,
            textAlign:      'center',
            textDecoration: 'none',
            display:        'block',
            fontFamily:     'inherit',
          }}
        >
          Directions
        </a>
      </div>

    </div>
    </>
  )
}
