'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import FilterSidebar from './FilterSidebar'

interface Props {
  totalCount: number
}

function countActiveFilters(params: URLSearchParams): number {
  let n = 0
  if (params.get('q'))                          n++
  if (params.get('type'))                       n++
  if (params.get('estate'))                     n++
  if (params.get('bedrooms') && params.get('bedrooms') !== 'any') n++
  if (params.get('minPrice'))                   n++
  if (params.get('maxPrice'))                   n++
  if (params.get('borehole') === '1')           n++
  if (params.get('powerBackup') === '1')        n++
  if (params.get('nearMatatu') === '1')         n++
  return n
}

export default function MobileFilterSheet({ totalCount }: Props) {
  const [open, setOpen]   = useState(false)
  const params            = useSearchParams()
  const activeFilterCount = countActiveFilters(params)

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-border2 px-4 py-2 font-sans font-bold text-[13px] text-ink hover:border-ink transition-colors"
      >
        <span aria-hidden="true">⚙</span>
        Filters
        {activeFilterCount > 0 && (
          <span className="bg-accent text-white font-sans text-[11px] font-bold w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[600]">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-border2 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border flex-shrink-0">
              <span className="font-sans font-bold text-[15px] text-ink">Filters</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-sans text-[13px] text-muted hover:text-ink transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar />
            </div>

            {/* Apply CTA */}
            <div className="flex-shrink-0 p-4 bg-white border-t border-border">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full bg-accent text-white font-sans font-bold text-[13px] uppercase tracking-[0.8px] py-4 hover:bg-accent-d transition-colors"
              >
                Show {totalCount} {totalCount === 1 ? 'property' : 'properties'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
