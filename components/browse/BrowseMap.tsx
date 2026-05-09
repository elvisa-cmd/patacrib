'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import NavigationModal from '@/components/shared/NavigationModal'
import type { BrowseProperty } from '@/types/property'

const BrowseMapInner = dynamic(
  () => import('./BrowseMapInner'),
  {
    ssr:     false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-surface2">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    ),
  },
)

interface BrowseMapProps {
  properties: BrowseProperty[]
}

export default function BrowseMap({ properties }: BrowseMapProps) {
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [navOpen,      setNavOpen]      = useState(false)
  const [navProperty,  setNavProperty]  = useState<BrowseProperty | null>(null)

  const selectedProperty = properties.find((p) => p.id === selectedId) ?? null

  return (
    <div className="relative w-full h-full">
      <BrowseMapInner
        properties={properties}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
      />

      {/* Property card popup when a pin is tapped */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-border2 shadow-xl p-4 w-[90%] md:w-[400px]">
          {selectedProperty.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedProperty.images[0]}
              alt={selectedProperty.title}
              className="w-full h-32 object-cover mb-3"
            />
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {selectedProperty.estate && (
                <p className="font-sans text-[10px] font-bold text-accent uppercase tracking-wide mb-1">
                  {selectedProperty.estate}
                </p>
              )}
              <p className="font-sans font-bold text-[13px] text-ink truncate">
                {selectedProperty.title}
              </p>
              <p className="font-sans text-[11px] text-muted mt-1">
                {selectedProperty.bedrooms}bd · {selectedProperty.bathrooms}ba
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-serif font-bold text-ink text-[15px]">
                KSh {Math.round(selectedProperty.price / 1_000)}K
              </p>
              <p className="font-sans text-[10px] text-muted">/month</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <a
              href={`/property/${selectedProperty.id}`}
              className="flex-1 border border-border2 text-ink font-sans font-bold text-[10px] uppercase tracking-wide py-2.5 text-center hover:bg-surface2 transition-colors"
            >
              View listing
            </a>
            <button
              onClick={() => {
                setNavProperty(selectedProperty)
                setNavOpen(true)
              }}
              className="flex-1 bg-accent text-white font-sans font-bold text-[10px] uppercase tracking-wide py-2.5 hover:bg-accent-d transition-colors"
            >
              🗺 Directions
            </button>
          </div>

          <button
            onClick={() => setSelectedId(null)}
            aria-label="Close property card"
            className="absolute top-2 right-2 w-6 h-6 bg-black/10 flex items-center justify-center text-[11px] hover:bg-black/20 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {navOpen && navProperty && (
        <NavigationModal
          isOpen={navOpen}
          onClose={() => setNavOpen(false)}
          property={{
            title:        navProperty.title,
            address:      navProperty.address,
            latitude:     navProperty.latitude,
            longitude:    navProperty.longitude,
            price:        navProperty.price,
            estate:       navProperty.estate,
            matatuRoutes: navProperty.matatuRoutes,
          }}
        />
      )}
    </div>
  )
}
