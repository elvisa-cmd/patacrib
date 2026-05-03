'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/price'

interface ListingPreviewProps {
  title:        string
  price:        string
  priceType:    string
  propertyType: string
  bedrooms:     number
  bathrooms:    number
  address:      string
  estate:       string
  description:  string
  images:       string[]
  lat:          number | null
  lng:          number | null
}

const CHECKLIST = [
  { key: 'title',       label: 'Title (≥ 5 characters)'    },
  { key: 'price',       label: 'Price set'                  },
  { key: 'type',        label: 'Property type selected'     },
  { key: 'description', label: 'Description (≥ 20 chars)'   },
  { key: 'gps',         label: 'GPS location captured'      },
  { key: 'photo',       label: 'At least 1 photo uploaded'  },
  { key: 'address',     label: 'Address entered'            },
] as const

export default function ListingPreview({
  title, price, priceType, propertyType, bedrooms, bathrooms,
  address, estate, description, images, lat, lng,
}: ListingPreviewProps) {
  const priceNum = Number(price)

  const checks: Record<string, boolean> = {
    title:       title.length >= 5,
    price:       priceNum > 0,
    type:        propertyType !== '',
    description: description.length >= 20,
    gps:         lat !== null && lng !== null,
    photo:       images.length > 0,
    address:     address.length >= 5,
  }

  const done  = Object.values(checks).filter(Boolean).length
  const total = CHECKLIST.length
  const pct   = Math.round((done / total) * 100)

  const priceLabel =
    priceType === 'month' ? '/mo' :
    priceType === 'year'  ? '/yr' : '/day'

  return (
    <div className="flex flex-col gap-4">

      {/* Preview card */}
      <div>
        <p className="font-sans text-[9px] uppercase tracking-[1.2px] text-muted mb-2">
          Live preview
        </p>
        <div className="border border-border bg-surface">
          <div
            className="relative bg-surface2"
            style={{ height: '160px' }}
          >
            {images[0] ? (
              <Image
                src={images[0]}
                alt="Preview"
                fill
                className="object-cover"
                sizes="340px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[40px]" aria-hidden="true">🏠</span>
              </div>
            )}
          </div>
          <div className="px-4 py-3">
            <p className="font-sans font-bold text-[13px] text-ink truncate mb-0.5">
              {title || 'Property title…'}
            </p>
            <p className="font-sans text-[11px] text-muted truncate mb-2">
              {estate || address || 'Address…'}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[18px] text-ink">
                {priceNum > 0 ? formatPrice(priceNum) : 'KSh —'}
              </span>
              <span className="font-sans text-[10px] text-muted">{priceLabel}</span>
            </div>
            {(bedrooms > 0 || bathrooms > 0 || propertyType) && (
              <p className="font-sans text-[10px] text-muted mt-1">
                {bedrooms > 0 ? `${bedrooms} bd` : ''}
                {bedrooms > 0 && bathrooms > 0 ? ' · ' : ''}
                {bathrooms > 0 ? `${bathrooms} ba` : ''}
                {propertyType ? `${bedrooms > 0 || bathrooms > 0 ? ' · ' : ''}${propertyType}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-surface border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[9px] uppercase tracking-[1.2px] text-muted">
            Publish checklist
          </p>
          <span className="font-sans font-bold text-[11px] text-accent">{done}/{total}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border overflow-hidden mb-4">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="flex flex-col gap-2.5">
          {CHECKLIST.map(item => (
            <li key={item.key} className="flex items-center gap-2.5">
              <span
                className={`w-4 h-4 flex-shrink-0 flex items-center justify-center font-sans text-[9px] font-bold transition-colors ${
                  checks[item.key]
                    ? 'bg-accent text-white'
                    : 'border border-border text-transparent'
                }`}
              >
                ✓
              </span>
              <span
                className={`font-sans text-[11px] transition-colors ${
                  checks[item.key] ? 'text-ink' : 'text-muted'
                }`}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        {done === total && (
          <div className="mt-4 bg-accent/10 border border-accent/20 px-3 py-2.5">
            <p className="font-sans font-bold text-[11px] text-accent">
              Ready to publish ✓
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
