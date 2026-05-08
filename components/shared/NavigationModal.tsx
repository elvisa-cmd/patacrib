'use client'

import { useState } from 'react'
import NavigationMap from './NavigationMap'
import type { RouteEstimate, DirectionStep } from '@/lib/utils'

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

export default function NavigationModal({
  isOpen,
  onClose,
  property,
}: NavigationModalProps) {
  const [route,      setRoute]      = useState<RouteEstimate | null>(null)
  const [directions, setDirections] = useState<DirectionStep[]>([])

  return (
    /* Full-screen overlay — slides up from bottom */
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col transition-transform duration-500 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="In-app navigation"
    >
      {isOpen && property && (
        <>
          {/* ── Top bar ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 bg-ink text-white flex-shrink-0">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
              aria-label="Close navigation"
            >
              ← Back
            </button>

            <div className="text-center flex-1 px-4">
              <p className="font-sans font-bold text-sm text-white truncate">
                {property.title}
              </p>
              <p className="font-sans text-[11px] text-white/50">
                {route
                  ? `${route.distKm} · ${route.walkMin} min walk`
                  : 'Calculating route…'}
              </p>
            </div>

            {/* Spacer to balance the back button */}
            <div className="w-16" aria-hidden="true" />
          </div>

          {/* ── Map — fills remaining height ─────────────────────────── */}
          <div className="flex-1 relative min-h-0">
            <NavigationMap
              lat={property.latitude}
              lng={property.longitude}
              title={property.title}
              address={property.address}
              onRouteCalculated={setRoute}
              onDirectionsReady={setDirections}
            />
          </div>

          {/* ── Bottom panel ─────────────────────────────────────────── */}
          <div className="bg-white border-t border-border flex-shrink-0">

            {/* Route summary row */}
            <div className="px-4 py-3 flex items-center gap-0 border-b border-border">
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
                <span className="text-2xl" aria-hidden="true">🚌</span>
                <div>
                  <p className="font-sans font-black text-lg text-ink leading-none">
                    {route?.matatuMin ?? '–'} min
                  </p>
                  <p className="font-sans text-[11px] text-muted">Matatu</p>
                </div>
              </div>

              <div className="w-px h-10 bg-border flex-shrink-0" />

              <div className="flex items-center gap-3 flex-1 px-4">
                <span className="text-2xl" aria-hidden="true">📍</span>
                <div>
                  <p className="font-sans font-black text-lg text-ink leading-none">
                    {route?.distKm ?? '–'}
                  </p>
                  <p className="font-sans text-[11px] text-muted">Distance</p>
                </div>
              </div>
            </div>

            {/* Turn-by-turn directions */}
            <div className="max-h-[35vh] overflow-y-auto">
              <div className="px-4 py-3">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[1px] text-muted mb-3">
                  Walking directions
                </p>

                {directions.length === 0 ? (
                  <p className="font-sans text-[12px] text-muted py-2">
                    {route ? 'Directions not available' : 'Allow location access to see directions'}
                  </p>
                ) : (
                  directions.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 mb-4">
                      {/* Step number */}
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-sans font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      {/* Instruction */}
                      <div className="flex-1">
                        <p className="font-sans font-bold text-[13px] text-ink leading-snug">
                          {step.instruction}
                        </p>
                        <p className="font-sans text-[11px] text-muted mt-0.5">
                          {step.distance}
                        </p>
                      </div>
                      {/* Arrow */}
                      <span className="text-xl text-muted flex-shrink-0" aria-hidden="true">
                        {step.arrow}
                      </span>
                    </div>
                  ))
                )}

                {/* Destination marker */}
                {directions.length > 0 && (
                  <div className="flex items-start gap-3 mt-4 pt-4 border-t border-border">
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-4 h-4 bg-accent rounded-full" />
                    </div>
                    <div>
                      <p className="font-sans font-bold text-[13px] text-accent">
                        You have arrived
                      </p>
                      <p className="font-sans text-[11px] text-muted mt-0.5">
                        {property.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Matatu routes chip list */}
            {property.matatuRoutes.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-surface">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[1px] text-muted mb-2">
                  Matatu routes to this property
                </p>
                <div className="flex gap-2 flex-wrap">
                  {property.matatuRoutes.map((route, i) => (
                    <span
                      key={i}
                      className="bg-accent text-white font-sans font-bold text-[11px] px-2.5 py-1"
                    >
                      {route.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
