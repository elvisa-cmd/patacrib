'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PropertyCard from '@/components/shared/PropertyCard'
import type { BrowseProperty } from '@/types/property'

interface PropertyGridProps {
  properties:    BrowseProperty[]
  totalCount:    number
  filterSummary: string
  currentSort:   string
  savedIds?:     string[]
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center">
      <span className="text-[64px] leading-none mb-4" aria-hidden="true">🏠</span>
      <p className="font-serif text-[24px] text-ink mb-2">No properties found</p>
      <p className="font-sans text-[14px] text-muted mb-5">Try adjusting your search or filters</p>
      <a
        href="/browse"
        className="font-sans text-[13px] text-accent hover:text-accent-d transition-colors underline"
      >
        Clear filters →
      </a>
    </div>
  )
}

export default function PropertyGrid({
  properties,
  totalCount,
  filterSummary,
  currentSort,
  savedIds = [],
}: PropertyGridProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const router  = useRouter()
  const params  = useSearchParams()

  function setSort(sort: string) {
    const p = new URLSearchParams(params.toString())
    if (sort === 'newest') p.delete('sort')
    else p.set('sort', sort)
    router.push(`/browse?${p.toString()}`)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-surface border-b border-border px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-[18px] text-ink leading-tight">
            {totalCount.toLocaleString('en-KE')} {totalCount === 1 ? 'property' : 'properties'} in Nairobi
          </p>
          {filterSummary && (
            <p className="font-sans text-[12px] text-muted truncate mt-0.5">{filterSummary}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sort */}
          <select
            value={currentSort}
            onChange={e => setSort(e.target.value)}
            className="font-sans text-[12px] text-ink border border-border bg-surface px-3 py-1.5 focus:outline-none focus:border-border2 transition-colors"
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="oldest">Oldest first</option>
          </select>

          {/* View toggle */}
          <div className="flex border border-border">
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Grid view"
              title="Grid view"
              className={`px-2.5 py-1.5 font-sans text-[14px] transition-colors ${
                view === 'grid' ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              }`}
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="List view"
              title="List view"
              className={`px-2.5 py-1.5 font-sans text-[14px] border-l border-border transition-colors ${
                view === 'list' ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              }`}
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {properties.map(p => (
                <PropertyCard key={p.id} property={p} mode="grid" isSaved={savedIds.includes(p.id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {properties.map(p => (
                <PropertyCard key={p.id} property={p} mode="list" isSaved={savedIds.includes(p.id)} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
