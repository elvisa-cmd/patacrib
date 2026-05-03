import PropertyGrid from './PropertyGrid'
import type { BrowseProperty } from '@/types/property'
import type { SearchFilters } from '@/lib/filters'

// ── Filter summary ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bedsitter: 'Bedsitter', studio: 'Studio', '1br': '1 Bed', '2br': '2 Beds',
  '3br': '3 Beds', '4br': '4 Beds', maisonette: 'Maisonette',
  bungalow: 'Bungalow', mansion: 'Mansion',
}

function buildFilterSummary(f: SearchFilters): string {
  const parts: string[] = []
  if (f.type)        parts.push(TYPE_LABELS[f.type] ?? f.type)
  if (f.estate)      parts.push(f.estate)
  if (f.bedrooms && f.bedrooms !== 'any') parts.push(`${f.bedrooms} bed${f.bedrooms === '1' ? '' : 's'}`)
  if (f.maxPrice)    parts.push(`Under KSh ${Number(f.maxPrice).toLocaleString('en-KE')}`)
  if (f.minPrice)    parts.push(`From KSh ${Number(f.minPrice).toLocaleString('en-KE')}`)
  if (f.q)           parts.push(`"${f.q}"`)
  if (f.borehole === '1')    parts.push('Borehole')
  if (f.powerBackup === '1') parts.push('Generator/Solar')
  if (f.nearMatatu === '1')  parts.push('Near matatu stage')
  return parts.join(' · ')
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ResultsAreaProps {
  properties: BrowseProperty[]
  totalCount: number
  filters:    SearchFilters
  savedIds?:  string[]
}

export default function ResultsArea({ properties, totalCount, filters, savedIds = [] }: ResultsAreaProps) {
  const summary     = buildFilterSummary(filters)
  const currentSort = filters.sort ?? 'newest'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PropertyGrid
        properties={properties}
        totalCount={totalCount}
        filterSummary={summary}
        currentSort={currentSort}
        savedIds={savedIds}
      />
    </div>
  )
}
