'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CardProperty {
  id:           string
  title:        string
  description?: string
  price:        number
  priceType:    string
  bedrooms:     number
  bathrooms:    number
  images:       string[]
  status:       string
  estate:       string | null
  city:         string
  address:      string
  latitude?:    number
  longitude?:   number
  propertyType: string
  _count?:      { savedBy: number; views: number }
}

interface PropertyCardProps {
  property:    CardProperty
  mode?:       'grid' | 'list' | 'compact'
  isSelected?: boolean
  onClick?:    () => void
  showSave?:   boolean
  isSaved?:    boolean
  onSave?:     () => void
  className?:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CBD_LAT = -1.286389
const CBD_LNG = 36.817223

function distanceToCBD(lat: number, lng: number): string {
  const R     = 6371
  const dLat  = (lat - CBD_LAT) * Math.PI / 180
  const dLng  = (lng - CBD_LNG) * Math.PI / 180
  const a     = Math.sin(dLat / 2) ** 2
    + Math.cos(CBD_LAT * Math.PI / 180) * Math.cos(lat * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  const d = 2 * R * Math.asin(Math.sqrt(a))
  return d < 1
    ? `${Math.round(d * 1000)}m from CBD`
    : `${d.toFixed(1)}km from CBD`
}

function formatPrice(price: number, priceType: string): string {
  const per = priceType === 'month' ? '/mo' : priceType === 'year' ? '/yr' : '/day'
  return `KSh ${price.toLocaleString('en-KE')}${per}`
}

const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #e6f2ec 0%, #b5d9c8 100%)'

const TYPE_LABELS: Record<string, string> = {
  bedsitter: 'Bedsitter', studio: 'Studio', '1br': '1 Bed', '2br': '2 Beds',
  '3br': '3 Beds', '4br': '4 Beds', maisonette: 'Maisonette',
  bungalow: 'Bungalow', mansion: 'Mansion',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available:   { label: 'Available',   cls: 'bg-green' },
    taken:       { label: 'Taken',       cls: 'bg-red' },
    maintenance: { label: 'Maintenance', cls: 'bg-gold' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gold' }
  return (
    <span className={`absolute bottom-2 left-2 ${cls} text-white text-[9px] font-sans font-semibold uppercase tracking-[0.8px] px-2 py-0.5`}>
      {label}
    </span>
  )
}

// ── Compact card (FeaturedStrip style, 220px) ─────────────────────────────────

function CompactCard({ property, isSelected, onClick }: PropertyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${property.title}`}
      className={`w-[220px] flex-shrink-0 bg-surface text-left transition-all cursor-pointer border ${
        isSelected
          ? 'border-accent shadow-sm'
          : 'border-border hover:border-border2'
      }`}
    >
      <div className="h-[100px] relative overflow-hidden" style={{ background: PLACEHOLDER_GRADIENT }}>
        {property.images[0] && (
          <Image src={property.images[0]} alt={property.title} fill className="object-cover" sizes="220px" />
        )}
        <StatusBadge status={property.status} />
      </div>
      <div className="p-3">
        {property.estate && (
          <p className="font-sans font-medium text-[8px] uppercase tracking-[1px] text-accent mb-0.5">
            {property.estate}
          </p>
        )}
        <p className="font-sans font-bold text-[13px] text-ink leading-snug mb-1.5 truncate">
          {property.title}
        </p>
        <p className="font-sans text-[10px] text-muted">
          {property.bedrooms}bd · {property.bathrooms}ba · {property.city}
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-sans font-medium text-[9px] uppercase tracking-[0.8px] text-accent">GPS pinned</span>
        </div>
      </div>
      <div className="border-t border-border px-3 py-2 flex items-center justify-between">
        <span className="font-serif text-[16px] text-ink">
          {property.price >= 1000 ? `KSh ${Math.round(property.price / 1000)}K` : `KSh ${property.price}`}
        </span>
        <span className="font-sans text-[11px] text-muted hover:text-accent transition-colors">View →</span>
      </div>
    </button>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function GridCard({ property, showSave = true, isSaved: initialIsSaved = false, className = '' }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const router = useRouter()
  const dist = property.latitude != null && property.longitude != null
    ? distanceToCBD(property.latitude, property.longitude)
    : null

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const prev = isSaved
    setIsSaved(!isSaved)
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      })
      if (res.status === 401) { setIsSaved(prev); router.push('/login'); return }
      if (!res.ok) { setIsSaved(prev); return }
      const data = await res.json()
      setIsSaved(data.saved)
    } catch {
      setIsSaved(prev)
    }
  }

  return (
    <a
      href={`/property/${property.id}`}
      className={`bg-surface border border-border flex flex-col group hover:-translate-y-1 hover:shadow-md transition-all duration-200 ${className}`}
    >
      {/* Image */}
      <div className="h-[180px] relative overflow-hidden flex-shrink-0" style={{ background: PLACEHOLDER_GRADIENT }}>
        {property.images[0] && (
          <Image src={property.images[0]} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 1200px) 33vw, 380px" />
        )}
        <StatusBadge status={property.status} />
        {/* GPS badge */}
        <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[8px] font-sans font-semibold uppercase tracking-[0.6px] px-1.5 py-0.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-green inline-block" />
          GPS
        </span>
        {/* Save button */}
        {showSave && (
          <button
            type="button"
            aria-label={isSaved ? 'Unsave property' : 'Save property'}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            onClick={handleSave}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path
                d="M6.5 11.5C6.5 11.5 1 7.8 1 4.5a2.5 2.5 0 0 1 5.5-1 2.5 2.5 0 0 1 5.5 1C12 7.8 6.5 11.5 6.5 11.5z"
                stroke="#1a6b4a"
                strokeWidth="1.2"
                fill={isSaved ? '#1a6b4a' : 'none'}
              />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-3.5 pt-3 pb-0">
        {property.estate && (
          <p className="font-sans text-[9px] uppercase tracking-[1px] text-accent font-semibold mb-1">
            {property.estate}
          </p>
        )}
        <p className="font-sans font-bold text-[14px] text-ink leading-snug mb-1.5 line-clamp-2">
          {property.title}
        </p>
        <p className="font-sans text-[10px] text-muted">
          {property.bedrooms}bd · {property.bathrooms}ba · {TYPE_LABELS[property.propertyType] ?? property.propertyType}
          {dist && ` · ${dist}`}
        </p>
        <p className="font-serif text-[18px] text-ink mt-2">
          {formatPrice(property.price, property.priceType).replace('/mo', '')}
          <span className="font-sans text-[10px] text-muted ml-0.5">
            /{property.priceType === 'month' ? 'mo' : property.priceType === 'year' ? 'yr' : 'day'}
          </span>
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3.5 py-2.5 mt-3">
        <span className="font-sans text-[11px] text-muted group-hover:text-accent transition-colors">
          View property →
        </span>
      </div>
    </a>
  )
}

// ── List card ─────────────────────────────────────────────────────────────────

function ListCard({ property, showSave = true, isSaved: initialIsSaved = false, className = '' }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const router = useRouter()
  const dist = property.latitude != null && property.longitude != null
    ? distanceToCBD(property.latitude, property.longitude)
    : null

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const prev = isSaved
    setIsSaved(!isSaved)
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      })
      if (res.status === 401) { setIsSaved(prev); router.push('/login'); return }
      if (!res.ok) { setIsSaved(prev); return }
      const data = await res.json()
      setIsSaved(data.saved)
    } catch {
      setIsSaved(prev)
    }
  }

  return (
    <a
      href={`/property/${property.id}`}
      className={`bg-surface border border-border flex group hover:border-border2 transition-colors ${className}`}
    >
      {/* Image */}
      <div className="w-[160px] flex-shrink-0 relative overflow-hidden" style={{ background: PLACEHOLDER_GRADIENT }}>
        {property.images[0] && (
          <Image src={property.images[0]} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="160px" />
        )}
        <StatusBadge status={property.status} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        <div>
          {property.estate && (
            <p className="font-sans text-[9px] uppercase tracking-[1px] text-accent font-semibold mb-1">
              {property.estate}
            </p>
          )}
          <p className="font-sans font-bold text-[14px] text-ink mb-1">{property.title}</p>
          {property.description && (
            <p className="font-sans text-[12px] text-muted line-clamp-1 mb-2">{property.description}</p>
          )}
          <p className="font-sans text-[10px] text-muted">
            {property.bedrooms}bd · {property.bathrooms}ba · {TYPE_LABELS[property.propertyType] ?? property.propertyType}
            {dist && ` · ${dist}`}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="font-serif text-[18px] text-ink">
            {formatPrice(property.price, property.priceType).replace('/mo', '')}
            <span className="font-sans text-[10px] text-muted ml-0.5">
              /{property.priceType === 'month' ? 'mo' : property.priceType === 'year' ? 'yr' : 'day'}
            </span>
          </p>
          <span className="font-sans text-[11px] text-muted group-hover:text-accent transition-colors">
            View property →
          </span>
        </div>
      </div>

      {/* Save */}
      {showSave && (
        <div className="flex-shrink-0 px-3 flex items-center">
          <button
            type="button"
            aria-label={isSaved ? 'Unsave property' : 'Save property'}
            className="w-7 h-7 border border-border flex items-center justify-center hover:border-accent transition-colors"
            onClick={handleSave}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M6.5 11.5C6.5 11.5 1 7.8 1 4.5a2.5 2.5 0 0 1 5.5-1 2.5 2.5 0 0 1 5.5 1C12 7.8 6.5 11.5 6.5 11.5z" stroke="#1a6b4a" strokeWidth="1.2" fill={isSaved ? '#1a6b4a' : 'none'} />
            </svg>
          </button>
        </div>
      )}
    </a>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function PropertyCard(props: PropertyCardProps) {
  const mode = props.mode ?? 'grid'
  if (mode === 'compact') return <CompactCard {...props} />
  if (mode === 'list')    return <ListCard    {...props} />
  return <GridCard {...props} />
}

export type { PropertyCardProps }
