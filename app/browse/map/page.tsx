import { prisma } from '@/lib/db'
import { BrowseMap } from '@/components/browse/BrowseMap'
import BackButton from '@/components/ui/BackButton'

export default async function BrowseMapPage() {
  const raw = await prisma.property.findMany({
    where:   { status: 'available' },
    orderBy: { createdAt: 'desc' },
    take:    100,
  }).catch(() => [])

  const properties = raw.map(p => ({
    id:           p.id,
    title:        p.title,
    price:        p.price,
    priceType:    p.priceType,
    bedrooms:     p.bedrooms,
    bathrooms:    p.bathrooms,
    propertyType: p.propertyType,
    address:      p.address,
    estate:       p.estate,
    city:         p.city,
    latitude:     p.latitude,
    longitude:    p.longitude,
    images:       p.images,
    status:       p.status,
    matatuRoutes: p.matatuRoutes,
    videoUrl:     p.videoUrl,
    tourImageUrl: p.tourImageUrl ?? null,
  }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
      {/* Back button */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
        <BackButton href="/browse" />
      </div>

      {/* Property count badge */}
      <div style={{
        position:    'absolute',
        top:         '16px',
        left:        '50%',
        transform:   'translateX(-50%)',
        zIndex:      10,
        background:  'rgba(255,255,255,0.95)',
        border:      '1px solid rgba(0,0,0,0.07)',
        borderRadius:'20px',
        padding:     '6px 14px',
        fontSize:    '12px',
        fontWeight:  700,
        color:       '#0f0e0c',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        whiteSpace:  'nowrap',
      }}>
        {properties.length} properties on map
      </div>

      <BrowseMap properties={properties} />
    </div>
  )
}
