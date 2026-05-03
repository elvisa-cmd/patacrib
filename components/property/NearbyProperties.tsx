import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/price'
import type { SerializedProperty } from '@/types/property'

const CARD_GRADIENT = 'linear-gradient(135deg, #e6f2ec 0%, #b5d9c8 100%)'

interface NearbyPropertiesProps {
  properties: SerializedProperty[]
  estate: string | null
}

export default function NearbyProperties({
  properties,
  estate,
}: NearbyPropertiesProps) {
  if (properties.length === 0) return null

  return (
    <section className="border-t border-border pt-8 mt-2">
      <h2 className="font-serif italic text-[24px] text-ink mb-6">
        More in {estate ?? 'Nairobi'}
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/property/${property.id}`}
            className="bg-surface border border-border hover:border-border2 transition-colors block"
          >
            <div
              className="h-[100px] relative overflow-hidden"
              style={{ background: CARD_GRADIENT }}
            >
              {property.images[0] && (
                <Image
                  src={property.images[0]}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
              )}
              <span className="absolute bottom-2 left-2 bg-green text-white text-[9px] font-sans font-semibold uppercase tracking-[0.8px] px-2 py-0.5">
                Available
              </span>
            </div>

            <div className="p-3">
              {property.estate && (
                <p className="font-sans font-medium text-[8px] uppercase tracking-[1px] text-accent mb-0.5">
                  {property.estate}
                </p>
              )}
              <p className="font-sans font-bold text-[13px] text-ink leading-snug mb-1 truncate">
                {property.title}
              </p>
              <p className="font-sans text-[10px] text-muted">
                {property.bedrooms}bd · {property.bathrooms}ba
              </p>
            </div>

            <div className="border-t border-border px-3 py-2 flex items-center justify-between">
              <span className="font-serif text-[15px] text-ink">
                {formatPrice(property.price)}
              </span>
              <span className="font-sans text-[10px] text-muted">View →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
