import { Prisma } from '@prisma/client'

export interface SearchFilters {
  q?:           string
  estate?:      string
  type?:        string
  minPrice?:    string
  maxPrice?:    string
  bedrooms?:    string
  sort?:        string
  borehole?:    string
  powerBackup?: string
  nearMatatu?:  string
  hasMatatu?:   string
  water?:       string
  tour?:        string
  power?:       string
  view?:        string
}

export function buildPropertyFilter(
  filters: SearchFilters
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {}

  if (filters.q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { title:       { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
          { estate:      { contains: filters.q, mode: 'insensitive' } },
          { address:     { contains: filters.q, mode: 'insensitive' } },
          { city:        { contains: filters.q, mode: 'insensitive' } },
        ],
      },
    ]
  }

  if (filters.estate) {
    where.estate = { equals: filters.estate, mode: 'insensitive' }
  }

  if (filters.type) {
    where.propertyType = filters.type
  }

  const minPrice = filters.minPrice ? Number(filters.minPrice) : undefined
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined

  if (minPrice && !isNaN(minPrice)) {
    where.price = { ...(where.price as object), gte: minPrice }
  }

  if (maxPrice && !isNaN(maxPrice)) {
    where.price = { ...(where.price as object), lte: maxPrice }
  }

  if (filters.bedrooms && filters.bedrooms !== 'any') {
    if (filters.bedrooms === '4+') {
      where.bedrooms = { gte: 4 }
    } else {
      where.bedrooms = Number(filters.bedrooms)
    }
  }

  if (filters.borehole === '1')    where.borehole    = true
  if (filters.powerBackup === '1') where.powerBackup = true
  if (filters.nearMatatu === '1')  where.matatuRoutes = { isEmpty: false }

  // Feature-strip filters
  if (filters.hasMatatu === 'true') {
    where.matatuRoutes = { isEmpty: false }
  }

  if (filters.water === 'daily') {
    where.waterSchedule = { contains: 'daily', mode: 'insensitive' }
  }

  if (filters.tour === 'true') {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { videoUrl:     { not: null } },
          { tourImageUrl: { not: null } },
        ],
      },
    ]
  }

  if (filters.power === 'true') {
    where.powerBackup = true
  }

  return where
}

export function buildPropertyOrderBy(
  sort?: string
): Prisma.PropertyOrderByWithRelationInput {
  switch (sort) {
    case 'price-asc':  return { price: 'asc' }
    case 'price-desc': return { price: 'desc' }
    case 'oldest':     return { createdAt: 'asc' }
    case 'safety':     return { safetyScore: 'desc' }
    default:           return { createdAt: 'desc' }
  }
}
