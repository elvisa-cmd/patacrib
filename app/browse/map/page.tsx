import { prisma } from '@/lib/db'
import { BrowseMap } from '@/components/browse/BrowseMap'

const BackArrow = ({ stroke = '#0f0e0c' }: { stroke?: string }) => (
  <svg width="16" height="16" fill="none" stroke={stroke} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
)

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex' }}>

      {/* Desktop left panel */}
      <div className="hidden md:flex md:flex-col" style={{
        width:        '280px',
        flexShrink:   0,
        background:   '#faf8f5',
        borderRight:  '1px solid rgba(0,0,0,0.07)',
        padding:      '28px 20px',
        gap:          '24px',
        overflowY:    'auto',
      }}>
        <a href="/" style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            '8px',
          textDecoration: 'none',
          color:          '#0f0e0c',
          fontSize:       '13px',
          fontWeight:     600,
        }}>
          <span style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '32px',
            height:          '32px',
            background:      'white',
            border:          '1px solid rgba(0,0,0,0.1)',
            borderRadius:    '8px',
            boxShadow:       '0 1px 4px rgba(0,0,0,0.08)',
            flexShrink:      0,
          }}>
            <BackArrow />
          </span>
          Back to home
        </a>

        <div>
          <span style={{ fontWeight: 800, fontSize: '22px', color: '#0f0e0c', letterSpacing: '-0.5px', fontFamily: 'Sora, sans-serif' }}>
            Pata<span style={{ color: '#1a6b4a' }}>Krib</span>
          </span>
          <p style={{ fontSize: '12px', color: '#87837c', margin: '4px 0 0', fontWeight: 500 }}>
            Map view
          </p>
        </div>

        <div style={{
          background:   'rgba(26,107,74,0.07)',
          border:       '1px solid rgba(26,107,74,0.15)',
          borderRadius: '12px',
          padding:      '14px 16px',
        }}>
          <p style={{ fontSize: '28px', fontWeight: 800, color: '#1a6b4a', margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            {properties.length}
          </p>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#87837c', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            properties on map
          </p>
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="md:hidden" style={{
          position:             'absolute',
          top:                  0,
          left:                 0,
          right:                0,
          height:               '56px',
          zIndex:               10,
          background:           'rgba(250,248,245,0.95)',
          backdropFilter:       'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom:         '1px solid rgba(0,0,0,0.07)',
          display:              'flex',
          alignItems:           'center',
          gap:                  '12px',
          padding:              '0 16px',
        }}>
          <a href="/" style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '36px',
            height:          '36px',
            background:      'white',
            borderRadius:    '10px',
            border:          '1px solid rgba(0,0,0,0.1)',
            textDecoration:  'none',
            flexShrink:      0,
            boxShadow:       '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <BackArrow />
          </a>
          <span style={{ fontWeight: 800, fontSize: '17px', color: '#0f0e0c', flex: 1, letterSpacing: '-0.3px' }}>
            Pata<span style={{ color: '#1a6b4a' }}>Krib</span>
          </span>
          <span style={{
            background:   'rgba(26,107,74,0.1)',
            color:        '#1a6b4a',
            fontSize:     '11px',
            fontWeight:   700,
            padding:      '4px 10px',
            borderRadius: '20px',
          }}>
            {properties.length}
          </span>
        </div>

        {/* Map — offset on mobile for top bar */}
        <div className="pt-14 md:pt-0" style={{ height: '100%' }}>
          <BrowseMap properties={properties} />
        </div>
      </div>

    </div>
  )
}
