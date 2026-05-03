import Image from 'next/image'
import { timeAgo } from '@/lib/utils'

type ViewItem = {
  id:         string
  propertyId: string
  viewedAt:   string
  property: {
    id:        string
    title:     string
    price:     number
    priceType: string
    estate:    string | null
    images:    string[]
  }
}

interface RecentlyViewedProps {
  views: ViewItem[]
}

export default function RecentlyViewed({ views }: RecentlyViewedProps) {
  return (
    <div className="bg-surface border border-border mt-4">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border">
        <h2 className="font-sans font-bold text-[13px] text-ink">Recently viewed</h2>
      </div>

      {/* Empty state */}
      {views.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="font-sans text-[12px] text-muted mb-1">No properties viewed yet</p>
          <p className="font-sans text-[11px] text-muted2">Start browsing to see your history</p>
        </div>
      ) : (
        <div>
          {views.map(v => {
            const per = v.property.priceType === 'month' ? '/mo'
              : v.property.priceType === 'year' ? '/yr' : '/day'
            return (
              <div
                key={v.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
              >
                {/* Thumbnail */}
                <div
                  className="w-10 h-10 flex-shrink-0 relative overflow-hidden bg-surface2"
                  style={{ background: 'linear-gradient(135deg, #e6f2ec 0%, #b5d9c8 100%)' }}
                >
                  {v.property.images[0] && (
                    <Image
                      src={v.property.images[0]}
                      alt={v.property.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-[12px] text-ink truncate">
                    {v.property.title}
                  </p>
                  <p className="font-sans text-[10px] text-muted">
                    {v.property.estate && `${v.property.estate} · `}
                    KSh {v.property.price.toLocaleString('en-KE')}{per}
                  </p>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <a
                    href={`/property/${v.property.id}`}
                    className="font-sans text-[10px] text-accent hover:text-accent-d transition-colors"
                  >
                    View →
                  </a>
                  <span className="font-sans text-[9px] text-muted2">
                    {timeAgo(new Date(v.viewedAt))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
