'use client'

import { useState, useEffect } from 'react'
import dynamic                  from 'next/dynamic'
import type { NavRoute }        from './NavigationMapInner'

const NavigationMap = dynamic(
  () => import('./NavigationMap'),
  {
    ssr:     false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-surface2">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-sans text-[12px] text-muted">Loading map…</p>
        </div>
      </div>
    ),
  },
)

export interface NavProperty {
  id?:          string
  title:        string
  address:      string
  latitude:     number
  longitude:    number
  price?:       number
  estate:       string | null
  matatuRoutes: string[]
}

export interface NavigationModalProps {
  isOpen:   boolean
  onClose:  () => void
  property: NavProperty | null
}

type TravelMode = 'walking' | 'matatu' | 'driving'

function arrivalTime(minsFromNow: number): string {
  const d = new Date(Date.now() + minsFromNow * 60_000)
  return d.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function openNativeMaps(userLat: number, userLng: number, destLat: number, destLng: number) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    window.open(`maps://maps.apple.com/?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&dirflg=d`)
  } else {
    window.open(`https://www.google.com/maps/dir/${userLat},${userLng}/${destLat},${destLng}`)
  }
}

export default function NavigationModal({ isOpen, onClose, property }: NavigationModalProps) {
  const [route,            setRoute]            = useState<NavRoute | null>(null)
  const [travelMode,       setTravelMode]       = useState<TravelMode>('walking')
  const [arrived,          setArrived]          = useState(false)
  const [distRemaining,    setDistRemaining]    = useState<number | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [userLat,          setUserLat]          = useState<number | null>(null)
  const [userLng,          setUserLng]          = useState<number | null>(null)

  useEffect(() => {
    setRoute(null)
    setArrived(false)
    setDistRemaining(null)
    setCurrentStepIndex(0)
    setUserLat(null)
    setUserLng(null)
  }, [property?.title])

  useEffect(() => {
    if (!route || !distRemaining || route.steps.length === 0) return
    const totalSteps = route.steps.length
    const progress   = Math.max(0, 1 - distRemaining / Math.max(1, route.distMetres))
    const estimated  = Math.floor(progress * totalSteps)
    setCurrentStepIndex(Math.min(estimated, totalSteps - 1))
  }, [distRemaining, route])

  const currentStep = route?.steps[currentStepIndex]

  const getInstruction = (): string => {
    if (!route) return 'Getting your location…'
    if (currentStep) return currentStep.instruction
    const d = route.distMetres
    if (d > 1000) return `Head toward ${property?.estate ?? 'destination'} — ${route.distanceText} away`
    if (d > 200)  return `Getting close — ${route.distanceText} remaining`
    return 'Almost there!'
  }

  const getCurrentArrow = (): string => {
    if (!route)       return '↑'
    if (currentStep)  return currentStep.arrow
    if (route.distMetres <= 200) return '🎯'
    return '↑'
  }

  const currentMins =
    !route          ? null :
    travelMode === 'walking' ? route.walkMinutes   :
    travelMode === 'matatu'  ? route.matatuMinutes :
    route.driveMinutes

  if (!isOpen || !property) return null

  // ── Arrived screen ──────────────────────────────────────────────────────────
  if (arrived) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#faf8f5] flex flex-col items-center justify-center p-8 text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h2 className="font-serif text-[40px] text-accent leading-tight mb-3">You have arrived!</h2>
        <p className="font-sans font-bold text-[15px] text-ink mb-1">{property.title}</p>
        <p className="font-sans text-[12px] text-muted mb-8">{property.address}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="border border-ink text-ink font-sans font-bold text-[12px] uppercase tracking-wide px-6 py-3 hover:bg-ink hover:text-white transition-colors"
          >
            ← Back
          </button>
          {property.id && (
            <a
              href={`/property/${property.id}`}
              className="bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-wide px-6 py-3 hover:bg-accent-d transition-colors"
            >
              View listing →
            </a>
          )}
        </div>
      </div>
    )
  }

  const transportOptions: Array<{
    mode:    TravelMode
    icon:    string
    label:   string
    mins:    number | null
  }> = [
    { mode: 'walking', icon: '🚶', label: 'Walk',   mins: route?.walkMinutes   ?? null },
    { mode: 'matatu',  icon: '🚌', label: 'Matatu', mins: route?.matatuMinutes ?? null },
    { mode: 'driving', icon: '🚗', label: 'Drive',  mins: route?.driveMinutes  ?? null },
  ]

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="In-app navigation"
    >
      {/* ── Top bar ───────────────────────────────────────────────────────────── */}
      <div className="bg-ink text-white flex-shrink-0">

        {/* Back + property title + arrival time */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-full flex-shrink-0 hover:bg-white/20 transition-colors"
            aria-label="Close navigation"
          >←</button>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-sm text-white truncate leading-snug">{property.title}</p>
            <p className="font-sans text-white/50 text-xs truncate">{property.address}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {distRemaining !== null && (
              <p className="font-sans font-black text-[20px] text-white leading-none">
                {distRemaining < 1000
                  ? `${Math.round(distRemaining)}m`
                  : `${(distRemaining / 1000).toFixed(1)}km`}
              </p>
            )}
            {currentMins !== null && (
              <p className="font-sans text-white/50 text-[10px] whitespace-nowrap">
                Arrive {arrivalTime(currentMins)}
              </p>
            )}
          </div>
        </div>

        {/* Current step instruction */}
        <div className="px-4 py-3 bg-accent flex items-center gap-3">
          <span className="text-2xl flex-shrink-0 font-bold">{getCurrentArrow()}</span>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-white font-bold text-sm leading-tight truncate">
              {getInstruction()}
            </p>
            {currentStep?.distance && (
              <p className="font-sans text-white/60 text-xs mt-0.5">{currentStep.distance}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Live map ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <NavigationMap
          property={property}
          onRouteReady={setRoute}
          onLocationUpdate={(data) => {
            setDistRemaining(data.distMetres)
            setUserLat(data.lat)
            setUserLng(data.lng)
            if (data.arrived) setArrived(true)
          }}
          travelMode={travelMode}
        />
      </div>

      {/* ── Bottom panel ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-border flex-shrink-0">

        {/* Bolt-style transport mode cards */}
        <div style={{ display: 'flex', gap: '8px', padding: '10px 16px 8px' }}>
          {transportOptions.map(opt => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setTravelMode(opt.mode)}
              style={{
                flex:       1,
                padding:    '10px 6px',
                background: travelMode === opt.mode ? 'rgba(26,107,74,0.08)' : '#fff',
                border:     travelMode === opt.mode ? '2px solid #1a6b4a' : '1.5px solid rgba(0,0,0,0.10)',
                borderRadius: '10px',
                cursor:     'pointer',
                textAlign:  'center',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ fontSize: '20px', lineHeight: 1 }}>{opt.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c', marginTop: '4px', lineHeight: 1 }}>
                {opt.mins !== null ? `${opt.mins} min` : '–'}
              </div>
              <div style={{ fontSize: '10px', color: '#6b6055', marginTop: '2px', lineHeight: 1 }}>
                {opt.mins !== null ? arrivalTime(opt.mins) : opt.label}
              </div>
            </button>
          ))}
        </div>

        {/* Distance chip */}
        {route && (
          <div style={{ padding: '0 16px 8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b6055' }}>
              📍 {route.distanceText} total distance
            </span>
          </div>
        )}

        {/* Matatu route chips */}
        {property.matatuRoutes.length > 0 && (
          <div className="px-4 py-2 bg-surface2 border-t border-border">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[1px] text-muted mb-1.5">
              Matatu routes nearby
            </p>
            <div className="flex gap-2 flex-wrap">
              {property.matatuRoutes.map((r, i) => (
                <span key={i} className="bg-accent text-white font-sans font-bold text-[11px] px-2.5 py-1">
                  {r.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-step directions */}
        {route && route.steps.length > 0 && (
          <div className="max-h-28 overflow-y-auto border-t border-border">
            {route.steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2 border-b border-border/50 transition-colors ${
                  i === currentStepIndex ? 'bg-[#e6f2ec]' : ''
                }`}
              >
                <span className={`text-lg flex-shrink-0 ${
                  i === currentStepIndex ? 'text-accent' :
                  i < currentStepIndex   ? 'text-muted2' : 'text-muted'
                }`}>
                  {step.arrow}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${
                    i === currentStepIndex ? 'text-accent' :
                    i < currentStepIndex   ? 'text-muted line-through' : 'text-ink'
                  }`}>
                    {step.instruction}
                  </p>
                  {step.distance && (
                    <p className="font-sans text-[9px] text-muted2">{step.distance}</p>
                  )}
                </div>
                {i < currentStepIndex && (
                  <span className="text-accent text-xs flex-shrink-0">✓</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Open in Google / Apple Maps + Close */}
        <div className="px-4 py-3 flex flex-col gap-2 border-t border-border">
          {userLat !== null && userLng !== null && (
            <button
              type="button"
              onClick={() => openNativeMaps(userLat!, userLng!, property.latitude, property.longitude)}
              style={{
                width:          '100%',
                padding:        '13px',
                background:     '#1a6b4a',
                color:          '#fff',
                border:         'none',
                borderRadius:   '12px',
                fontSize:       '13px',
                fontWeight:     700,
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
              }}
            >
              🗺 Open in Google Maps
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full border border-border text-muted font-sans font-bold text-xs uppercase tracking-wide py-3 hover:border-ink hover:text-ink transition-colors"
          >
            ✕ Close navigation
          </button>
        </div>
      </div>
    </div>
  )
}
