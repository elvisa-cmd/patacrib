import Image from 'next/image'
import PropertyActions from './PropertyActions'

interface PropertyRow {
  id:           string
  title:        string
  price:        number
  priceType:    string
  status:       string
  estate:       string | null
  city:         string
  propertyType: string
  images:       string[]
  _count:       { savedBy: number; views: number }
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'available') {
    return (
      <span className="bg-green/10 text-green font-sans font-bold text-[9px] uppercase tracking-[0.8px] px-2.5 py-1">
        Available
      </span>
    )
  }
  if (status === 'taken') {
    return (
      <span className="bg-blue/10 text-blue font-sans font-bold text-[9px] uppercase tracking-[0.8px] px-2.5 py-1">
        Rented
      </span>
    )
  }
  return (
    <span className="bg-gold/10 text-gold font-sans font-bold text-[9px] uppercase tracking-[0.8px] px-2.5 py-1">
      Maintenance
    </span>
  )
}

export default function PropertiesTable({ properties }: { properties: PropertyRow[] }) {
  if (properties.length === 0) {
    return (
      <div className="bg-surface border border-border">
        <div className="px-5 py-4 flex items-center justify-between border-b border-border">
          <h2 className="font-sans font-bold text-[14px] text-ink">Your Properties</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <span className="text-[48px] mb-4" aria-hidden="true">🏠</span>
          <p className="font-sans font-bold text-[14px] text-ink mb-1">No properties yet</p>
          <p className="font-sans text-[12px] text-muted mb-6">
            Start by adding your first listing
          </p>
          <a
            href="/dashboard/add"
            className="bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-[0.8px] px-5 py-2.5 hover:bg-accent-d transition-colors"
          >
            + Add Property
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border">
      {/* Card header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-border">
        <h2 className="font-sans font-bold text-[14px] text-ink">Your Properties</h2>
        <a
          href="/browse"
          className="font-sans text-[12px] text-accent hover:text-accent-d transition-colors"
        >
          View all →
        </a>
      </div>

      {/* Table header */}
      <div className="bg-surface2 grid grid-cols-[2fr_1fr_1fr_80px_80px_100px] gap-0 px-5 py-2.5 border-b border-border">
        {['Property', 'Price', 'Status', 'Views', 'Saves', 'Actions'].map(col => (
          <span
            key={col}
            className="font-sans text-[9px] uppercase tracking-[1px] text-muted"
          >
            {col}
          </span>
        ))}
      </div>

      {/* Rows */}
      {properties.map((p) => (
        <div
          key={p.id}
          className="grid grid-cols-[2fr_1fr_1fr_80px_80px_100px] gap-0 px-5 py-3.5 border-b border-border items-center hover:bg-surface2 transition-colors duration-150 last:border-0"
        >
          {/* Property */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-9 relative flex-shrink-0 border border-border overflow-hidden bg-surface2">
              {p.images[0] ? (
                <Image
                  src={p.images[0]}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="48px"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base" aria-hidden="true">🏠</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-sans font-bold text-[13px] text-ink truncate leading-tight">
                {p.title}
              </p>
              <p className="font-sans text-[10px] text-muted truncate">
                {p.estate ?? p.city} · {p.propertyType}
              </p>
            </div>
          </div>

          {/* Price */}
          <div>
            <span className="font-serif text-[15px] text-ink">
              KSh {p.price >= 100_000
                ? `${Math.round(p.price / 1000)}K`
                : p.price.toLocaleString('en-KE')}
            </span>
            <span className="font-sans text-[10px] text-muted">
              /{p.priceType === 'month' ? 'mo' : p.priceType === 'year' ? 'yr' : 'day'}
            </span>
          </div>

          {/* Status */}
          <div>
            <StatusBadge status={p.status} />
          </div>

          {/* Views */}
          <div>
            <p className="font-sans text-[13px] text-ink">{p._count.views}</p>
            <p className="font-sans text-[10px] text-muted">views</p>
          </div>

          {/* Saves */}
          <div>
            <p className="font-sans text-[13px] text-muted">♡ {p._count.savedBy}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <a
              href={`/dashboard/edit/${p.id}`}
              className="border border-border font-sans text-[10px] text-muted px-2.5 py-1 hover:border-border2 hover:text-ink transition-colors"
            >
              Edit
            </a>
            <a
              href={`/property/${p.id}`}
              className="border border-border font-sans text-[10px] text-muted px-2.5 py-1 hover:border-border2 hover:text-ink transition-colors"
            >
              View
            </a>
            <PropertyActions propertyId={p.id} currentStatus={p.status} />
          </div>
        </div>
      ))}
    </div>
  )
}
