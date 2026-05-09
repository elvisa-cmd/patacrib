import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import { ImageGallery } from '@/components/property/ImageGallery'
import PropertyInfo from '@/components/property/PropertyInfo'
import KenyaDetails from '@/components/property/KenyaDetails'
import PropertyMap from '@/components/property/PropertyMap'
import PriceCard from '@/components/property/PriceCard'
import MobilePropertyBar from '@/components/property/MobilePropertyBar'
import NearbyProperties from '@/components/property/NearbyProperties'
import type { DetailedProperty, SerializedProperty } from '@/types/property'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Crash early: empty id is never a valid cuid
  if (!id) notFound()

  const [property, session] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        admin: {
          include: { _count: { select: { properties: true } } },
        },
      },
    }),
    getServerSession(authOptions),
  ])

  if (!property) notFound()

  // Crash early: orphaned property with no admin should not render
  if (!property.admin) notFound()

  const userId = session?.user?.userId ?? null

  const [nearby, isSaved] = await Promise.all([
    prisma.property.findMany({
      where: { status: 'available', NOT: { id } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    userId
      ? prisma.savedProperty
          .findUnique({
            where: { userId_propertyId: { userId, propertyId: id } },
          })
          .then(Boolean)
      : Promise.resolve(false),
  ])

  // Fire-and-forget view tracking — never blocks the page render
  if (userId) {
    prisma.propertyView
      .create({ data: { propertyId: id, userId } })
      .catch(() => {})
  }

  // ── Serialise for client components (no Date objects) ─────────────

  const detailedProperty: DetailedProperty = {
    id:            property.id,
    title:         property.title,
    description:   property.description,
    price:         property.price,
    priceType:     property.priceType,
    bedrooms:      property.bedrooms,
    bathrooms:     property.bathrooms,
    propertyType:  property.propertyType,
    address:       property.address,
    estate:        property.estate,
    city:          property.city,
    latitude:      property.latitude,
    longitude:     property.longitude,
    images:        property.images,
    videoUrl:      property.videoUrl,
    features:      property.features,
    amenities:     property.amenities,
    waterSchedule: property.waterSchedule,
    matatuRoutes:  property.matatuRoutes,
    safetyScore:   property.safetyScore,
    powerBackup:   property.powerBackup,
    borehole:      property.borehole,
    status:        property.status,
    createdAt:     property.createdAt.toISOString(),
    adminId:       property.adminId,
    admin: {
      name:  property.admin.name,
      email: property.admin.email,
      phone: property.admin.phone,
    },
  }

  const nearbyProperties: SerializedProperty[] = nearby.map((p) => ({
    id:            p.id,
    title:         p.title,
    price:         p.price,
    priceType:     p.priceType,
    bedrooms:      p.bedrooms,
    bathrooms:     p.bathrooms,
    address:       p.address,
    estate:        p.estate,
    city:          p.city,
    latitude:      p.latitude,
    longitude:     p.longitude,
    images:        p.images,
    status:        p.status,
    createdAt:     p.createdAt.toISOString(),
    propertyType:  p.propertyType,
    safetyScore:   p.safetyScore,
    matatuRoutes:  p.matatuRoutes,
    waterSchedule: p.waterSchedule,
    powerBackup:   p.powerBackup,
  }))

  const totalListings = property.admin._count.properties

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[60px]">
        {/* Full-width image gallery */}
        <ImageGallery
          images={detailedProperty.images}
          title={detailedProperty.title}
          status={detailedProperty.status}
          price={detailedProperty.price}
          priceType={detailedProperty.priceType}
          estate={detailedProperty.estate}
        />

        {/* Two-column layout — single column on mobile */}
        <div className="px-4 md:px-16 py-0 flex flex-col md:flex-row gap-6 md:gap-10 items-start pb-24 md:pb-0">

          {/* Right — price card (shows FIRST on mobile) */}
          <div className="w-full md:w-[340px] md:flex-shrink-0 md:sticky md:top-20 md:py-8 order-1 md:order-2 hidden md:block">
            <PriceCard
              price={detailedProperty.price}
              priceType={detailedProperty.priceType}
              propertyId={detailedProperty.id}
              adminId={detailedProperty.adminId}
              adminName={detailedProperty.admin.name}
              isSaved={isSaved}
              isLoggedIn={!!session}
              lat={detailedProperty.latitude}
              lng={detailedProperty.longitude}
              address={detailedProperty.address}
              title={detailedProperty.title}
              totalListings={totalListings}
              estate={detailedProperty.estate}
              matatuRoutes={detailedProperty.matatuRoutes}
            />
          </div>

          {/* Left — scrollable details */}
          <div className="flex-1 min-w-0 order-2 md:order-1">
            <PropertyInfo property={detailedProperty} />
            <KenyaDetails
              waterSchedule={detailedProperty.waterSchedule}
              matatuRoutes={detailedProperty.matatuRoutes}
              safetyScore={detailedProperty.safetyScore}
              powerBackup={detailedProperty.powerBackup}
              borehole={detailedProperty.borehole}
              amenities={detailedProperty.amenities}
              address={detailedProperty.address}
              latitude={detailedProperty.latitude}
              longitude={detailedProperty.longitude}
            />
            <PropertyMap
              lat={detailedProperty.latitude}
              lng={detailedProperty.longitude}
              address={detailedProperty.address}
              title={detailedProperty.title}
              propertyId={detailedProperty.id}
            />
            <NearbyProperties
              properties={nearbyProperties}
              estate={detailedProperty.estate}
            />
          </div>

        </div>

        {/* Sticky mobile bar — shown instead of sidebar */}
        <MobilePropertyBar
          lat={detailedProperty.latitude}
          lng={detailedProperty.longitude}
          title={detailedProperty.title}
          address={detailedProperty.address}
          price={detailedProperty.price}
          priceType={detailedProperty.priceType}
          isLoggedIn={!!session}
          adminId={detailedProperty.adminId}
          propertyId={detailedProperty.id}
          estate={detailedProperty.estate}
          matatuRoutes={detailedProperty.matatuRoutes}
        />
      </main>
    </div>
  )
}
