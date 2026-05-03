import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CreatePropertySchema, SearchFiltersSchema } from '@/lib/validations'
import { findNearbyProperties } from '@/lib/geo'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  // Crash early: validate filters before querying
  const parsed = SearchFiltersSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { q, city, estate, minPrice, maxPrice, propertyType, bedrooms, maxDistance, lat, lng } =
    parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { status: 'available' }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { estate: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (estate) where.estate = { contains: estate, mode: 'insensitive' }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    }
  }
  if (propertyType) where.propertyType = propertyType
  if (bedrooms !== undefined) where.bedrooms = bedrooms

  const properties = await prisma.property.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { name: true, phone: true, email: true } },
      _count: { select: { savedBy: true, views: true } },
    },
  })

  // Apply GPS distance filter if coordinates provided
  if (maxDistance !== undefined && lat !== undefined && lng !== undefined) {
    const nearby = findNearbyProperties(lat, lng, maxDistance, properties)
    return NextResponse.json({ properties: nearby })
  }

  return NextResponse.json({ properties })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.userType !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: admin access required' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Crash early: validate all fields before DB write
  const parsed = CreatePropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const property = await prisma.property.create({
    data: { ...parsed.data, adminId: session.user.userId },
  })

  return NextResponse.json({ property }, { status: 201 })
}
