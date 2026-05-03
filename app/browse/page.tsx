import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import FilterSidebar from '@/components/browse/FilterSidebar'
import ResultsArea from '@/components/browse/ResultsArea'
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

  const [properties, totalCount, savedRows] = await Promise.all([
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

  const savedIds = savedRows.map(r => r.propertyId)

  const serialized: BrowseProperty[] = properties.map(p => ({
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
    _count:        p._count,
  }))

  return (
    <div className="h-screen overflow-hidden bg-bg flex flex-col">
      <Nav />
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: '60px' }}>
        <FilterSidebar />
        <ResultsArea
          properties={serialized}
          totalCount={totalCount}
          filters={filters}
          savedIds={savedIds}
        />
      </div>
    </div>
  )
}
