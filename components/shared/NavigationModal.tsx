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

export default function NavigationModal({ isOpen, onClose, property }: NavigationModalProps) {
  const [route,             setRoute]             = useState<NavRoute | null>(null)
  const [travelMode,        setTravelMode]        = useState<TravelMode>('walking')
  const [arrived,           setArrived]           = useState(false)
  const [distRemaining,     setDistRemaining]     = useState<number | null>(null)
  const [currentStepIndex,  setCurrentStepIndex]  = useState(0)

  // Reset when property changes
  useEffect(() => {
    setRoute(null)
    setArrived(false)
    setDistRemaining(null)
    setCurrentStepIndex(0)
  }, [property?.title])

  // Advance step based on remaining distance
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

  if (!isOpen || !property) return null

  // ── Arrived screen ─────────────────────────────────────────────────────────
  if (arrived) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#faf8f5] flex flex-col items-center justify-center p-8 text-center">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h2 className="font-serif text-[40px] text-accent leading-tight mb-3">
          You have arrived!
        </h2>
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

  const modeBtn = (mode: TravelMode, emoji: string, time: string) => (
    <button
      key={mode}
      onClick={() => setTravelMode(mode)}
      className={`flex-1 py-3 flex flex-col items-center gap-0.5 border-r border-white/10 last:border-r-0 transition-colors ${
        travelMode === mode ? 'bg-white/15' : 'hover:bg-white/8'
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span className={`font-sans text-[11px] font-bold leading-none mt-0.5 ${travelMode === mode ? 'text-white' : 'text-white/40'}`}>
        {time}
      </span>
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="In-app navigation"
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-ink text-white flex-shrink-0">

        {/* Back + title */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-full flex-shrink-0 hover:bg-white/20 transition-colors"
            aria-label="Close navigation"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-sm text-white truncate leading-snug">
              {property.title}
            </p>
            <p className="font-sans text-white/50 text-xs truncate">{property.address}</p>
          </div>
          {distRemaining !== null && (
            <div className="text-right flex-shrink-0">
              <p className="font-sans font-black text-[20px] text-white leading-none">
                {distRemaining < 1000
                  ? `${Math.round(distRemaining)}m`
                  : `${(distRemaining / 1000).toFixed(1)}km`
                }
              </p>
              <p className="font-sans text-white/40 text-[9px] uppercase tracking-wide">remaining</p>
            </div>
          )}
        </div>

        {/* Travel mode selector */}
        <div className="flex border-t border-white/10 divide-x divide-white/10">
          {modeBtn('walking', '🚶', route?.walkText  ?? '--')}
          {modeBtn('matatu',  '🚌', route?.matatuText ?? '--')}
          {modeBtn('driving', '🚗', route?.driveText  ?? '--')}
        </div>

        {/* Current instruction */}
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

      {/* ── Live map ────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <NavigationMap
          property={property}
          onRouteReady={setRoute}
          onLocationUpdate={(data) => {
            setDistRemaining(data.distMetres)
            if (data.arrived) setArrived(true)
          }}
          travelMode={travelMode}
        />
      </div>

      {/* ── Bottom panel ────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-border flex-shrink-0">

        {/* Walk / Matatu / Drive summary */}
        <div className="flex items-center px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">🚶</span>
            <div>
              <p className="font-sans font-black text-base text-ink leading-none">
                {route?.walkText ?? '– min'}
              </p>
              <p className="font-sans text-[11px] text-muted">Walking</p>
            </div>
          </div>
          <div className="w-px h-10 bg-border flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1 px-4">
            <span className="text-xl">🚌</span>
            <div>
              <p className="font-sans font-black text-base text-ink leading-none">
                {route?.matatuText ?? '– min'}
              </p>
              <p className="font-sans text-[11px] text-muted">Matatu</p>
            </div>
          </div>
          <div className="w-px h-10 bg-border flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1 px-4">
            <span className="text-xl">🚗</span>
            <div>
              <p className="font-sans font-black text-base text-ink leading-none">
                {route?.driveText ?? '– min'}
              </p>
              <p className="font-sans text-[11px] text-muted">Drive</p>
            </div>
          </div>
        </div>

        {/* Matatu route chips */}
        {property.matatuRoutes.length > 0 && (
          <div className="px-4 py-3 bg-surface2 border-b border-border">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[1px] text-muted mb-2">
              Matatu routes nearby
            </p>
            <div className="flex gap-2 flex-wrap">
              {property.matatuRoutes.map((r, i) => (
                <span key={i} className="bg-accent text-white font-sans font-bold text-[11px] px-2.5 py-1">
                  {r.trim()}
                </span>
              ))}
            </div>
            {travelMode === 'matatu' && (
              <p className="font-sans text-[10px] text-muted mt-1.5">+ 5 min waiting time at stage</p>
            )}
          </div>
        )}

        {/* Step-by-step directions */}
        {route && route.steps.length > 0 && (
          <div className="max-h-36 overflow-y-auto">
            {route.steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2 border-b border-border/50 transition-colors ${
                  i === currentStepIndex ? 'bg-[#e6f2ec]' : ''
                }`}
              >
                <span className={`text-lg flex-shrink-0 ${
                  i === currentStepIndex ? 'text-accent'  :
                  i < currentStepIndex   ? 'text-muted2'  : 'text-muted'
                }`}>
                  {step.arrow}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${
                    i === currentStepIndex ? 'text-accent'            :
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

        {/* Close */}
        <div className="px-4 py-3">
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
