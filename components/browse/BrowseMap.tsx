'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import NavigationModal from '@/components/shared/NavigationModal'

const BrowseMapInner = dynamic(
  () => import('./BrowseMapInner'),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full flex items-center justify-center bg-surface2"
        style={{ minHeight: '500px' }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted font-bold">Loading map…</p>
        </div>
      </div>
    ),
  },
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BrowseMap({ properties }: { properties: any[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [navOpen,     setNavOpen]     = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [navProperty, setNavProperty] = useState<any>(null)

  const selected = properties.find((p) => p.id === selectedId)

  return (
    <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
      <BrowseMapInner
        properties={properties}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
      />

      {/* Property card popup — clicking the card navigates to property */}
      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-2xl border border-border w-[90%] md:w-[380px] overflow-hidden">
          <a href={`/property/${selected.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            {selected.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.images[0]}
                alt={selected.title}
                className="w-full h-28 object-cover"
              />
            )}

            <div className="p-3">
              {selected.estate && (
                <p className="text-[9px] font-bold uppercase tracking-wide text-accent mb-1">
                  {selected.estate}
                </p>
              )}
              <p className="font-bold text-sm text-ink mb-1 truncate">{selected.title}</p>
              <p className="text-xs text-muted mb-3">
                {selected.propertyType !== 'commercial'
                  ? `${selected.bedrooms}bd · ${selected.bathrooms}ba · `
                  : ''}
                {selected.address}
              </p>

              <div className="flex items-center justify-between">
                <p className="font-serif font-bold text-lg text-ink">
                  KSh {Math.round(selected.price / 1_000)}K
                  <span className="text-xs text-muted font-sans font-normal">/mo</span>
                </p>

                <div className="flex gap-2">
                  <span className="bg-accent text-white text-[10px] font-bold uppercase tracking-wide px-4 py-2">
                    View →
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setNavProperty(selected)
                      setNavOpen(true)
                    }}
                    className="border border-border2 text-ink text-[10px] font-bold uppercase tracking-wide px-3 py-2 hover:bg-surface2 transition-colors flex items-center gap-1"
                  >
                    🗺 Directions
                  </button>
                </div>
              </div>
            </div>
          </a>

          <button
            onClick={() => setSelectedId(null)}
            aria-label="Close"
            className="absolute top-2 right-2 w-7 h-7 bg-black/30 text-white text-xs font-bold flex items-center justify-center hover:bg-black/50 transition-colors"
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
            matatuRoutes: navProperty.matatuRoutes ?? [],
          }}
        />
      )}
    </div>
  )
}
