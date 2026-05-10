import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import HeroHeadline from '@/components/home/HeroHeadline'
import SearchBar from '@/components/home/SearchBar'
import HomeContent from '@/components/home/HomeContent'
import FeaturesStrip from '@/components/home/FeaturesStrip'
import HowItWorks from '@/components/home/HowItWorks'
import Footer from '@/components/home/Footer'
import type { SerializedProperty } from '@/types/property'

export default async function HomePage() {
  let totalListings  = 0
  let totalLandlords = 0
  let estatesCovered = 0
  let raw: Awaited<ReturnType<typeof prisma.property.findMany>> = []

  try {
    const [properties, listingCount, landlordCount, estateGroups] = await Promise.all([
      prisma.property.findMany({
        where:   { status: 'available' },
        orderBy: { createdAt: 'desc' },
        take:    12,
      }),
      prisma.property.count({ where: { status: 'available' } }),
      prisma.user.count({ where: { userType: 'ADMIN' } }),
      prisma.property.groupBy({
        by:    ['estate'],
        where: { status: 'available' },
      }),
    ])
    raw            = properties
    totalListings  = listingCount
    totalLandlords = landlordCount
    estatesCovered = estateGroups.filter(e => e.estate !== null).length
  } catch (error) {
    console.error('[homepage] DB error:', error)
  }

  const stats = { totalListings, totalLandlords, estatesCovered, gpsVerified: 100 }

  const properties: SerializedProperty[] = raw.map((p) => ({
    id:           p.id,
    title:        p.title,
    price:        p.price,
    priceType:    p.priceType,
    bedrooms:     p.bedrooms,
    bathrooms:    p.bathrooms,
    address:      p.address,
    estate:       p.estate,
    city:         p.city,
    latitude:     p.latitude,
    longitude:    p.longitude,
    images:       p.images,
    status:       p.status,
    createdAt:    p.createdAt.toISOString(),
    propertyType: p.propertyType,
    safetyScore:  p.safetyScore,
    matatuRoutes: p.matatuRoutes,
    waterSchedule:p.waterSchedule,
    powerBackup:  p.powerBackup,
  }))

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Nav />
      <main>
        <HeroHeadline />
        <SearchBar />
        <HomeContent properties={properties} stats={stats} />
        <FeaturesStrip />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
