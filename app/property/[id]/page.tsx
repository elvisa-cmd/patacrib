import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const property = await prisma.property.findUnique({
    where:  { id },
    select: { id: true, title: true, price: true, propertyType: true, estate: true, city: true, bedrooms: true, images: true, description: true },
  })

  if (!property) {
    return {
      title:       'Property Not Found',
      description: 'This property listing could not be found on PataKrib.',
    }
  }

  const title = `${property.title} — KSh ${property.price?.toLocaleString('en-KE')}/mo`
  const description = `${property.propertyType || 'Property'} for rent in ${property.estate || property.city || 'Kenya'}.${property.bedrooms > 0 ? ` ${property.bedrooms} bedrooms.` : ''} KSh ${property.price?.toLocaleString('en-KE')} per month. GPS-verified location with precise directions.`
  const image = property.images?.[0] || '/og-image.png'
  const url   = `https://patacrib.vercel.app/property/${property.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'PataKrib',
      locale:   'en_KE',
      type:     'website',
      images:   [{ url: image, width: 1200, height: 630, alt: property.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [image],
    },
  }
}
import { ImageGallery } from '@/components/property/ImageGallery'
import { VirtualTour } from '@/components/property/VirtualTour'
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

  if (!id) notFound()

  // Primary fetch — call notFound on any DB failure
  const [rawProperty, session] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        admin: {
          include: { _count: { select: { properties: true } } },
        },
      },
    }).catch((err) => { console.error('[property-detail] DB error:', err); return null }),
    getServerSession(authOptions).catch(() => null),
  ])

  if (!rawProperty || !rawProperty.admin) notFound()

  const property = rawProperty
  const userId   = session?.user?.userId ?? null

  // Fetch nearby + saved state — non-fatal
  let nearby:  Awaited<ReturnType<typeof prisma.property.findMany>> = []
  let isSaved = false

  try {
    ;[nearby, isSaved] = await Promise.all([
      prisma.property.findMany({
        where:   { status: 'available', NOT: { id } },
        orderBy: { createdAt: 'desc' },
        take:    4,
      }),
      userId
        ? prisma.savedProperty
            .findUnique({
              where: { userId_propertyId: { userId, propertyId: id } },
            })
            .then(Boolean)
        : Promise.resolve(false),
    ])
  } catch (error) {
    console.error('[property-detail] DB error fetching nearby:', error)
  }

  // Fire-and-forget view tracking
  if (userId) {
    prisma.propertyView
      .create({ data: { propertyId: id, userId } })
      .catch(() => {})
  }

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
    tourImageUrl:  property.tourImageUrl ?? null,
    features:      property.features,
    amenities:     property.amenities,
    waterSchedule: property.waterSchedule,
    matatuRoutes:  property.matatuRoutes,
    safetyScore:   property.safetyScore,
    powerBackup:   property.powerBackup,
    borehole:      property.borehole,
    plusCode:      property.plusCode,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type':    'RealEstateListing',
            name:       property.title,
            description: property.description ?? `${property.propertyType} for rent in ${property.estate || property.city}`,
            url:        `https://patacrib.vercel.app/property/${property.id}`,
            image:      property.images || [],
            offers: {
              '@type':    'Offer',
              price:      property.price,
              priceCurrency: 'KES',
              priceSpecification: {
                '@type':       'UnitPriceSpecification',
                price:         property.price,
                priceCurrency: 'KES',
                unitText:      'MONTH',
              },
              availability: property.status === 'available'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
            address: {
              '@type':          'PostalAddress',
              streetAddress:    property.address || '',
              addressLocality:  property.estate || property.city || 'Nairobi',
              addressCountry:   'KE',
            },
            ...(property.latitude && property.longitude ? {
              geo: {
                '@type':    'GeoCoordinates',
                latitude:   property.latitude,
                longitude:  property.longitude,
              },
            } : {}),
            ...(property.bedrooms > 0 ? { numberOfRooms: property.bedrooms } : {}),
          }),
        }}
      />
      <Nav />

      <main style={{ position: 'relative' }}>
        {/* Floating back button */}
        <a href="/browse" style={{
          position:             'absolute',
          top:                  '14px',
          left:                 '14px',
          width:                '38px',
          height:               '38px',
          background:           'rgba(255,255,255,0.92)',
          border:               '1px solid rgba(255,255,255,0.6)',
          borderRadius:         '12px',
          display:              'flex',
          alignItems:           'center',
          justifyContent:       'center',
          textDecoration:       'none',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow:            '0 2px 8px rgba(0,0,0,0.1)',
          zIndex:               20,
        }}>
          <svg width="16" height="16" fill="none" stroke="#0f0e0c" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>

        <ImageGallery
          images={detailedProperty.images}
          title={detailedProperty.title}
          status={detailedProperty.status}
          price={detailedProperty.price}
          priceType={detailedProperty.priceType}
          estate={detailedProperty.estate}
        />

        <div className="px-4 md:px-16 pt-6">
          <VirtualTour
            videoUrl={detailedProperty.videoUrl}
            tourImageUrl={detailedProperty.tourImageUrl}
            propertyTitle={detailedProperty.title}
          />
        </div>

        <div className="px-4 md:px-16 py-0 flex flex-col md:flex-row gap-6 md:gap-10 items-start pb-24 md:pb-0">

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

          <div className="flex-1 min-w-0 order-2 md:order-1">
            <PropertyInfo property={detailedProperty} />

            {detailedProperty.plusCode && (
              <div className="px-0 mb-4">
                <a
                  href={`https://plus.codes/${detailedProperty.plusCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    gap:            '6px',
                    padding:        '6px 12px',
                    background:     'rgba(26,107,74,0.08)',
                    border:         '1px solid rgba(26,107,74,0.2)',
                    borderRadius:   '20px',
                    fontSize:       '12px',
                    fontWeight:     600,
                    color:          '#1a6b4a',
                    textDecoration: 'none',
                    fontFamily:     'monospace',
                  }}
                >
                  📍 {detailedProperty.plusCode}
                  <span style={{ fontSize: '10px', fontWeight: 400, fontFamily: 'sans-serif', color: '#4a9870' }}>
                    Open in maps ↗
                  </span>
                </a>
              </div>
            )}

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
