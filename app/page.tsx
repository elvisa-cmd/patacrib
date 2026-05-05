import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import HeroHeadline from '@/components/home/HeroHeadline'
import SearchBar from '@/components/home/SearchBar'
import HomeContent from '@/components/home/HomeContent'
import StatsBar from '@/components/home/StatsBar'
import FeaturesStrip from '@/components/home/FeaturesStrip'
import HowItWorks from '@/components/home/HowItWorks'
import Footer from '@/components/home/Footer'
import type { SerializedProperty } from '@/types/property'

export default async function HomePage() {
  const raw = await prisma.property.findMany({
    where: { status: 'available' },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  const properties: SerializedProperty[] = raw.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    priceType: p.priceType,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    address: p.address,
    estate: p.estate,
    city: p.city,
    latitude: p.latitude,
    longitude: p.longitude,
    images: p.images,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    propertyType: p.propertyType,
    safetyScore: p.safetyScore,
    matatuRoutes: p.matatuRoutes,
    waterSchedule: p.waterSchedule,
    powerBackup: p.powerBackup,
  }))

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Nav />
      <main>
        <HeroHeadline />
        <SearchBar />
        <HomeContent properties={properties} />
        <StatsBar />
        <FeaturesStrip />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
