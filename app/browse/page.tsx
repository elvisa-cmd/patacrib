import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import FilterSidebar from '@/components/browse/FilterSidebar'
import ResultsArea from '@/components/browse/ResultsArea'
import MobileFilterSheet from '@/components/browse/MobileFilterSheet'
import { buildPropertyFilter, buildPropertyOrderBy } from '@/lib/filters'
import type { SearchFilters } from '@/lib/filters'
import type { BrowseProperty } from '@/types/property'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchFilters>
}) {
  const [filters, session] = await Promise.all([searchParams, getServerSession(authOptions)])
  const where    = buildPropertyFilter(filters)
  const orderBy  = buildPropertyOrderBy(filters.sort)

  let properties: BrowseProperty[] = []
  let totalCount = 0
  let savedIds:   string[] = []

  try {
    const [rows, count, savedRows] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        take: 24,
        include: {
          _count: { select: { savedBy: true, views: true } },
        },
      }),
      prisma.property.count({ where }),
      session?.user?.userId
        ? prisma.savedProperty.findMany({
            where:  { userId: session.user.userId },
            select: { propertyId: true },
          })
        : Promise.resolve([]),
    ])

    totalCount = count
    savedIds   = savedRows.map(r => r.propertyId)

    properties = rows.map(p => ({
      id:            p.id,
      title:         p.title,
      description:   p.description,
      price:         p.price,
      priceType:     p.priceType,
      bedrooms:      p.bedrooms,
      bathrooms:     p.bathrooms,
      propertyType:  p.propertyType,
      address:       p.address,
      estate:        p.estate,
      city:          p.city,
      latitude:      p.latitude,
      longitude:     p.longitude,
      images:        p.images,
      status:        p.status,
      createdAt:     p.createdAt.toISOString(),
      safetyScore:   p.safetyScore,
      matatuRoutes:  p.matatuRoutes,
      waterSchedule: p.waterSchedule,
      powerBackup:   p.powerBackup,
      borehole:      p.borehole,
      videoUrl:      p.videoUrl,
      tourImageUrl:  p.tourImageUrl,
      _count:        p._count,
    }))
  } catch (error) {
    console.error('[browse] DB error:', error)
  }

  return (
    <div className="h-screen overflow-hidden bg-bg flex flex-col">
      <Nav />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden" style={{ paddingTop: '60px' }}>

        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex md:flex-col w-[280px] flex-shrink-0 border-r border-border overflow-y-auto">
          <FilterSidebar />
        </div>

        {/* Results column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile filter bar */}
          <div className="md:hidden flex-shrink-0 border-b border-border px-4 py-3 flex items-center justify-between bg-surface">
            <span className="font-sans font-bold text-[14px] text-ink">
              {totalCount} {totalCount === 1 ? 'property' : 'properties'}
            </span>
            <MobileFilterSheet totalCount={totalCount} />
          </div>

          <ResultsArea
            properties={properties}
            totalCount={totalCount}
            filters={filters}
            savedIds={savedIds}
          />
        </div>

      </div>
    </div>
  )
}
