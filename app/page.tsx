import { unstable_cache } from 'next/cache'
import { prisma }         from '@/lib/db'
import Nav                from '@/components/home/Nav'
import HeroHeadline       from '@/components/home/HeroHeadline'
import SearchBar          from '@/components/home/SearchBar'
import HomeContent        from '@/components/home/HomeContent'
import FeaturesStrip      from '@/components/home/FeaturesStrip'
import HowItWorks         from '@/components/home/HowItWorks'
import Footer             from '@/components/home/Footer'
import type { SerializedProperty } from '@/types/property'

// Cache the DB result for 60 s, independently of the page render cycle.
// This means even though Nav makes the page "dynamic" (auth cookies),
// the expensive Prisma queries only run once per minute — not on every HMR
// reload in dev, and not on every request in production.
const getHomepageData = unstable_cache(
  async () => {
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
    return { properties, listingCount, landlordCount, estateGroups }
  },
  ['homepage-listings'],
  { revalidate: 60, tags: ['listings'] },
)

export default async function HomePage() {
  let totalListings  = 0
  let totalLandlords = 0
  let estatesCovered = 0
  let raw: Awaited<ReturnType<typeof prisma.property.findMany>> = []
  let dbError = false

  try {
    const data     = await getHomepageData()
    raw            = data.properties
    totalListings  = data.listingCount
    totalLandlords = data.landlordCount
    estatesCovered = data.estateGroups.filter(e => e.estate !== null).length
  } catch (error) {
    console.error('[homepage] DB error:', error)
    dbError = true
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
    videoUrl:     p.videoUrl,
    tourImageUrl: p.tourImageUrl,
  }))

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Nav />
      <main>
        <HeroHeadline />
        <SearchBar />
        {dbError && (
          <div style={{
            background: '#fff3cd', borderBottom: '1px solid #f0c040',
            padding: '10px 16px', textAlign: 'center',
            fontSize: '13px', color: '#7a5c00', fontFamily: 'sans-serif',
          }}>
            Listings temporarily unavailable — database connection issue.{' '}
            <a href="/" style={{ fontWeight: 700, color: '#7a5c00', textDecoration: 'underline' }}>
              Refresh
            </a>
          </div>
        )}
        <HomeContent properties={properties} stats={stats} dbError={dbError} />
        <FeaturesStrip />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
