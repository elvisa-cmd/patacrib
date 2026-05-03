import DescriptionToggle from './DescriptionToggle'
import type { DetailedProperty } from '@/types/property'

interface PropertyInfoProps {
  property: DetailedProperty
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  bedsitter:  'Bedsitter',
  studio:     'Studio',
  '1br':      '1 Bedroom',
  '2br':      '2 Bedrooms',
  '3br':      '3 Bedrooms',
  '4br':      '4 Bedrooms',
  maisonette: 'Maisonette',
  bungalow:   'Bungalow',
  mansion:    'Mansion',
}

export default function PropertyInfo({ property }: PropertyInfoProps) {
  const typeLabel =
    PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType

  const specs = [
    { value: String(property.bedrooms),   label: 'Bedrooms'   },
    { value: String(property.bathrooms),  label: 'Bathrooms'  },
    { value: typeLabel,                   label: 'Type'       },
    { value: property.status === 'available' ? 'Available' : 'Taken', label: 'Status' },
    { value: property.priceType === 'month' ? '/mo' : '/yr',          label: 'Billing' },
  ]

  return (
    <div className="py-8">
      {/* Breadcrumb */}
      <p className="font-sans text-[11px] uppercase tracking-[1.2px] text-muted mb-4">
        Nairobi
        {property.estate && (
          <>
            {' › '}
            <span className="text-ink">{property.estate}</span>
          </>
        )}
        {' › '}
        <span className="text-ink">{typeLabel}</span>
      </p>

      {/* Title */}
      <h1
        className="font-serif text-[32px] text-ink leading-tight mb-2"
        style={{ letterSpacing: '-0.5px' }}
      >
        {property.title}
      </h1>

      <p className="font-sans font-light text-[13px] text-muted mb-6">
        {typeLabel} · {property.city}
      </p>

      {/* Specs row */}
      <div className="grid grid-cols-5 border border-border mb-8">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`px-4 py-3 ${i < specs.length - 1 ? 'border-r border-border' : ''}`}
          >
            <p className="font-sans font-bold text-[14px] text-ink truncate">
              {spec.value}
            </p>
            <p className="font-sans text-[9px] uppercase tracking-[1px] text-muted2 mt-0.5">
              {spec.label}
            </p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="mb-8">
        <p className="font-sans font-medium text-[11px] uppercase tracking-[1.2px] text-muted mb-3">
          About this property
        </p>
        <DescriptionToggle description={property.description} />
      </div>

      {/* Features */}
      {property.features.length > 0 && (
        <div>
          <p className="font-sans font-medium text-[11px] uppercase tracking-[1.2px] text-muted mb-3">
            Features &amp; amenities
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {property.features.map((feature) => (
              <div
                key={feature}
                className="border border-border px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.8px] text-muted hover:bg-accent-l hover:text-accent transition-colors cursor-default"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
