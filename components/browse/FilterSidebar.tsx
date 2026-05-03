'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Data ──────────────────────────────────────────────────────────────────────

const TYPES = [
  { label: 'All',        value: '' },
  { label: 'Bedsitter',  value: 'bedsitter' },
  { label: '1 Bed',      value: '1br' },
  { label: '2 Beds',     value: '2br' },
  { label: '3 Beds',     value: '3br' },
  { label: '4+ Beds',    value: '4br' },
  { label: 'Studio',     value: 'studio' },
  { label: 'Maisonette', value: 'maisonette' },
  { label: 'Bungalow',   value: 'bungalow' },
  { label: 'Mansion',    value: 'mansion' },
]

const ESTATES = [
  '', 'Westlands', 'Kilimani', 'Lavington', 'Karen', 'South B',
  'Upperhill', 'Ngong Road', 'Parklands', 'Eastleigh', 'South C',
  'Langata', 'Kasarani', 'Ruaka', 'Kiambu Road',
]

const BEDROOM_OPTS = ['any', '1', '2', '3', '4+']

const PRICE_PRESETS = [
  { label: 'Under 20K',  max: '20000',  min: '' },
  { label: '20–40K',     max: '40000',  min: '20000' },
  { label: '40–80K',     max: '80000',  min: '40000' },
  { label: '80K+',       max: '',       min: '80000' },
]

// ── Chip ─────────────────────────────────────────────────────────────────────

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-sans text-[10px] px-3 py-1.5 border transition-colors ${
        active
          ? 'bg-accent text-white border-accent'
          : 'border-border text-muted hover:border-border2 hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[9px] uppercase tracking-[1px] text-muted mb-2.5">
      {children}
    </p>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FilterSidebar() {
  const router     = useRouter()
  const params     = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Local state mirrors URL (for controlled inputs)
  const [searchVal, setSearchVal] = useState(params.get('q') ?? '')
  const [minPrice,  setMinPrice]  = useState(params.get('minPrice') ?? '')
  const [maxPrice,  setMaxPrice]  = useState(params.get('maxPrice') ?? '')

  // Sync search value if URL changes externally (e.g. clear all)
  useEffect(() => {
    setSearchVal(params.get('q') ?? '')
    setMinPrice(params.get('minPrice') ?? '')
    setMaxPrice(params.get('maxPrice') ?? '')
  }, [params])

  function update(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    router.push(`/browse?${p.toString()}`)
  }

  function updateMultiple(changes: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    router.push(`/browse?${p.toString()}`)
  }

  const handleSearchChange = (val: string) => {
    setSearchVal(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => update('q', val || null), 400)
  }

  const handlePriceBlur = () => {
    updateMultiple({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    })
  }

  const currentType     = params.get('type')     ?? ''
  const currentEstate   = params.get('estate')   ?? ''
  const currentBedrooms = params.get('bedrooms') ?? 'any'

  const activeAmenities = {
    borehole:    params.get('borehole')    === '1',
    powerBackup: params.get('powerBackup') === '1',
    nearMatatu:  params.get('nearMatatu')  === '1',
  }

  const hasFilters = !!(params.get('q') || params.get('estate') || params.get('type') ||
    params.get('minPrice') || params.get('maxPrice') || params.get('bedrooms') ||
    params.get('borehole') || params.get('powerBackup') || params.get('nearMatatu'))

  return (
    <aside className="w-[280px] flex-shrink-0 h-full overflow-y-auto border-r border-border bg-surface">
      <div className="px-5 py-5 space-y-7">

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"
          >
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchVal}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search estate, area, property…"
            className="w-full bg-surface2 border border-border pl-8 pr-3 py-2 font-sans text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-border2 transition-colors"
          />
        </div>

        {/* Property type */}
        <div>
          <FilterLabel>Property type</FilterLabel>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map(t => (
              <Chip
                key={t.value}
                label={t.label}
                active={currentType === t.value}
                onClick={() => update('type', t.value || null)}
              />
            ))}
          </div>
        </div>

        {/* Estate */}
        <div>
          <FilterLabel>Estate</FilterLabel>
          <div className="flex flex-wrap gap-1.5">
            {ESTATES.map(e => (
              <Chip
                key={e}
                label={e || 'All'}
                active={currentEstate === e}
                onClick={() => update('estate', e || null)}
              />
            ))}
          </div>
        </div>

        {/* Price range */}
        <div>
          <FilterLabel>Price range (KSh)</FilterLabel>
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="Min"
              className="w-full bg-surface2 border border-border px-3 py-2 font-sans text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-border2 transition-colors"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="Max"
              className="w-full bg-surface2 border border-border px-3 py-2 font-sans text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-border2 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map(p => {
              const active = params.get('maxPrice') === p.max && params.get('minPrice') === p.min
              return (
                <Chip
                  key={p.label}
                  label={p.label}
                  active={active}
                  onClick={() => {
                    setMinPrice(p.min)
                    setMaxPrice(p.max)
                    updateMultiple({ minPrice: p.min || null, maxPrice: p.max || null })
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <FilterLabel>Bedrooms</FilterLabel>
          <div className="flex gap-1.5">
            {BEDROOM_OPTS.map(b => (
              <Chip
                key={b}
                label={b === 'any' ? 'Any' : b}
                active={currentBedrooms === b}
                onClick={() => update('bedrooms', b === 'any' ? null : b)}
              />
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <FilterLabel>Amenities</FilterLabel>
          <div className="flex flex-col gap-2.5">
            {/* GPS verified — always checked, decorative */}
            <label className="flex items-center gap-2.5 cursor-default opacity-60">
              <input type="checkbox" checked readOnly className="w-3.5 h-3.5 accent-accent" />
              <span className="font-sans text-[12px] text-ink">GPS verified</span>
            </label>

            {[
              { key: 'borehole',    label: 'Borehole backup' },
              { key: 'powerBackup', label: 'Generator / Solar' },
              { key: 'nearMatatu',  label: 'Near matatu stage' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeAmenities[key as keyof typeof activeAmenities]}
                  onChange={e => update(key, e.target.checked ? '1' : null)}
                  className="w-3.5 h-3.5 accent-accent"
                />
                <span className="font-sans text-[12px] text-ink">{label}</span>
              </label>
            ))}

            {/* Decorative (no filter param defined) */}
            {['Daily water supply', 'Parking included', 'Security guard'].map(label => (
              <label key={label} className="flex items-center gap-2.5 cursor-pointer opacity-50">
                <input type="checkbox" disabled className="w-3.5 h-3.5 accent-accent" />
                <span className="font-sans text-[12px] text-muted">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchVal('')
              setMinPrice('')
              setMaxPrice('')
              router.push('/browse')
            }}
            className="font-sans text-[12px] text-muted hover:text-ink underline transition-colors"
          >
            Clear all filters
          </button>
        )}

      </div>
    </aside>
  )
}
