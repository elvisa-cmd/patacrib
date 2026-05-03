'use client'

import dynamic from 'next/dynamic'

const MapInner = dynamic(() => import('./PropertyMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="bg-surface2 flex items-center justify-center"
      style={{ height: '200px' }}
    >
      <p className="font-sans text-[11px] text-muted">Loading map…</p>
    </div>
  ),
})

interface PropertyMapProps {
  lat:        number
  lng:        number
  address:    string
  title:      string
  propertyId: string
}

export default function PropertyMap({
  lat,
  lng,
  address,
  title,
  propertyId,
}: PropertyMapProps) {
  return (
    <div className="mb-8">
      <p className="font-sans font-medium text-[11px] uppercase tracking-[1.2px] text-muted mb-3">
        📍 Location
      </p>

      <div className="relative border border-border overflow-hidden">
        <MapInner lat={lat} lng={lng} title={title} height="200px" />
        <a
          href={`/browse?highlight=${propertyId}`}
          className="absolute bottom-2 right-2 z-[1000] bg-surface border border-border font-sans font-medium text-[10px] uppercase tracking-[0.5px] text-muted px-2.5 py-1.5 hover:text-ink transition-colors"
        >
          View full map →
        </a>
      </div>

      {/* GPS coordinates panel */}
      <div className="bg-ink px-4 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div>
              <p className="font-sans text-[8px] uppercase tracking-[1.5px] text-white/30 mb-0.5">
                LAT
              </p>
              <p className="font-sans font-bold text-[13px] text-white">
                {Math.abs(lat).toFixed(4)}°&nbsp;{lat < 0 ? 'S' : 'N'}
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="font-sans text-[8px] uppercase tracking-[1.5px] text-white/30 mb-0.5">
                LNG
              </p>
              <p className="font-sans font-bold text-[13px] text-white">
                {Math.abs(lng).toFixed(4)}°&nbsp;{lng >= 0 ? 'E' : 'W'}
              </p>
            </div>
          </div>

          <div className="w-40">
            <div className="h-0.5 bg-white/10 overflow-hidden mb-1">
              <div className="h-full bg-accent" style={{ width: '70%' }} />
            </div>
            <p className="font-sans text-[9px] text-white/30">±3m accuracy</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 max-w-[160px]">
          <p className="font-sans font-semibold text-[12px] text-white/70 leading-snug">
            {address}
          </p>
          <p className="font-sans text-[10px] text-white/30 mt-0.5">Nairobi, Kenya</p>
        </div>
      </div>
    </div>
  )
}
