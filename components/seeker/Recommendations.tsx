import PropertyCard from '@/components/shared/PropertyCard'
import type { CardProperty } from '@/components/shared/PropertyCard'

interface RecommendationsProps {
  properties: (CardProperty & { createdAt: string })[]
}

export default function Recommendations({ properties }: RecommendationsProps) {
  if (properties.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="font-serif italic text-[24px] text-ink mb-5">Recommended for you</h2>
      <div className="grid grid-cols-3 gap-4">
        {properties.map(p => (
          <PropertyCard key={p.id} property={p} mode="grid" />
        ))}
      </div>
    </section>
  )
}
