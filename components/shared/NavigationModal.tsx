'use client'

import { useState } from 'react'
import NavigationMap from './NavigationMap'

export interface NavProperty {
  title:        string
  address:      string
  latitude:     number
  longitude:    number
  price:        number
  estate:       string | null
  matatuRoutes: string[]
}

export interface NavigationModalProps {
  isOpen:   boolean
  onClose:  () => void
  property: NavProperty | null
}

interface Route {
  distMetres: number
  distKm:     string
  walkMin:    number
  driveMin:   number
  matatuMin:  number
  rawKm:      number
}

export default function NavigationModal({ isOpen, onClose, property }: NavigationModalProps) {
  const [route,      setRoute]      = useState<Route | null>(null)
  const [travelMode, setTravelMode] = useState<'walking' | 'driving'>('walking')

  const getInstruction = (): string => {
    if (!route || !property) return 'Getting your location…'
    const d = route.distMetres
    if (d > 1000) return `Head toward ${property.estate ?? 'destination'} — ${route.distKm} away`
    if (d > 500)  return `Continue for ${route.distKm}`
    if (d > 200)  return `Getting close — ${route.distKm} remaining`
    if (d > 50)   return `Almost there — ${route.distKm} to destination`
    return 'You have arrived at your destination!'
  }

  const getETA = (): string => {
    if (!route) return '--'
    const mins = travelMode === 'walking' ? route.walkMin : route.driveMin
    if (mins < 1) return '< 1 min'
    return `${mins} min`
  }

  if (!isOpen || !property) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white animate-slideUp"
      role="dialog"
      aria-modal="true"
      aria-label="In-app navigation"
    >
      {/* ── Top bar (dark, Uber-style) ─────────────────────────────────────── */}
      <div className="bg-ink text-white flex-shrink-0">

        {/* Back button + property title */}
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
            <p className="font-sans text-white/50 text-xs truncate">
              {property.address}
            </p>
          </div>
        </div>

        {/* ETA · Distance · Mode toggle */}
        <div className="flex items-center border-t border-white/10">
          <div className="flex-1 px-4 py-3 text-center border-r border-white/10">
            <p className="font-sans font-black text-2xl text-white leading-none">{getETA()}</p>
            <p className="font-sans text-white/40 text-xs mt-0.5">
              {travelMode === 'walking' ? 'walking' : 'driving'}
            </p>
          </div>

          <div className="flex-1 px-4 py-3 text-center border-r border-white/10">
            <p className="font-sans font-black text-2xl text-white leading-none">
              {route?.distKm ?? '--'}
            </p>
            <p className="font-sans text-white/40 text-xs mt-0.5">remaining</p>
          </div>

          <div className="flex-1 px-4 py-3 text-center">
            <button
              onClick={() => setTravelMode(m => m === 'walking' ? 'driving' : 'walking')}
              className="text-2xl block mx-auto mb-0.5"
              aria-label="Switch travel mode"
            >
              {travelMode === 'walking' ? '🚶' : '🚗'}
            </button>
            <p className="font-sans text-white/40 text-xs">switch</p>
          </div>
        </div>

        {/* Current instruction banner */}
        <div className="px-4 py-3 bg-accent flex items-center gap-3">
          <span className="text-xl flex-shrink-0" aria-hidden="true">
            {route && route.distMetres <= 200 ? '🎯' : '↑'}
          </span>
          <p className="font-sans text-white font-bold text-sm leading-tight">
            {getInstruction()}
          </p>
        </div>
      </div>

      {/* ── Live map (fills remaining space) ──────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <NavigationMap
          property={property}
          onRouteCalculated={setRoute}
          onLocationUpdate={() => {}}
          travelMode={travelMode}
        />
      </div>

      {/* ── Bottom panel ──────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-border flex-shrink-0">

        {/* Walk / Drive / Distance stats */}
        <div className="px-4 py-3 flex items-center border-b border-border">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl" aria-hidden="true">🚶</span>
            <div>
              <p className="font-sans font-black text-lg text-ink leading-none">
                {route?.walkMin ?? '–'} min
              </p>
              <p className="font-sans text-[11px] text-muted">Walking</p>
            </div>
          </div>

          <div className="w-px h-10 bg-border flex-shrink-0" />

          <div className="flex items-center gap-3 flex-1 px-4">
            <span className="text-2xl" aria-hidden="true">🚗</span>
            <div>
              <p className="font-sans font-black text-lg text-ink leading-none">
                {route?.driveMin ?? '–'} min
              </p>
              <p className="font-sans text-[11px] text-muted">Drive</p>
            </div>
          </div>

          <div className="w-px h-10 bg-border flex-shrink-0" />

          <div className="flex items-center gap-3 flex-1 px-4">
            <span className="text-2xl" aria-hidden="true">🚌</span>
            <div>
              <p className="font-sans font-black text-lg text-ink leading-none">
                {route?.matatuMin ?? '–'} min
              </p>
              <p className="font-sans text-[11px] text-muted">Matatu</p>
            </div>
          </div>
        </div>

        {/* Matatu route chips */}
        {property.matatuRoutes.length > 0 && (
          <div className="px-4 py-3 bg-surface2">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[1px] text-muted mb-2">
              Matatu routes nearby
            </p>
            <div className="flex gap-2 flex-wrap">
              {property.matatuRoutes.map((r, i) => (
                <span
                  key={i}
                  className="bg-accent text-white font-sans font-bold text-[11px] px-2.5 py-1"
                >
                  {r.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
