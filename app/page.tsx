import { Suspense }        from 'react'
import { unstable_cache }  from 'next/cache'
import { redirect }        from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions }     from '@/lib/auth'
import { prisma }          from '@/lib/db'
import Nav                 from '@/components/home/Nav'
import HomeContent         from '@/components/home/HomeContent'
import FeaturesStrip       from '@/components/home/FeaturesStrip'
import HowItWorks          from '@/components/home/HowItWorks'
import Footer              from '@/components/home/Footer'
import SkeletonLoader      from '@/components/ui/SkeletonLoader'
import type { SerializedProperty } from '@/types/property'

const LISTER_TYPES = ['LANDLORD', 'LISTER', 'AGENT', 'AGENCY', 'ADMIN']

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

const CATEGORY_PILLS = [
  { label: 'All',        href: '/browse' },
  { label: 'Apartments', href: '/browse?type=apartment' },
  { label: 'Houses',     href: '/browse?type=house' },
  { label: 'Commercial', href: '/browse?type=commercial' },
  { label: 'Tours',      href: '/browse?tour=true' },
]

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.userType && LISTER_TYPES.includes(session.user.userType)) {
    redirect('/dashboard')
  }

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
    createdAt:    p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    propertyType: p.propertyType,
    safetyScore:  p.safetyScore,
    matatuRoutes: p.matatuRoutes,
    waterSchedule:p.waterSchedule,
    powerBackup:  p.powerBackup,
    videoUrl:     p.videoUrl,
    tourImageUrl: p.tourImageUrl,
  }))

  const hour     = new Date().getHours()
  const timeWord = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return (
    <div style={{ background: '#faf8f5', minHeight: '100vh', overflowX: 'hidden' }}>
      <Nav />

      {/* Greeting */}
      <div style={{ padding: '20px 16px 4px' }}>
        <p style={{ fontSize: '12px', color: '#87837c', marginBottom: '6px', fontWeight: 500 }}>
          Good {timeWord} 👋
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f0e0c', lineHeight: 1.2, margin: 0, letterSpacing: '-0.4px' }}>
          Find your{' '}
          <span style={{ color: '#1a6b4a', fontStyle: 'italic' }}>perfect</span>
          {' '}home
        </h1>
      </div>

      {/* Search bar */}
      <form
        action="/browse"
        method="GET"
        style={{
          margin:      '12px 16px',
          background:  '#fff',
          border:      '1px solid rgba(0,0,0,0.07)',
          borderRadius:'14px',
          padding:     '11px 14px',
          display:     'flex',
          gap:         '10px',
          alignItems:  'center',
        }}
      >
        <span style={{ fontSize: '16px', flexShrink: 0 }}>🔍</span>
        <input
          name="q"
          type="text"
          placeholder="Search estates, areas, price range…"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex:       1,
            border:     'none',
            outline:    'none',
            background: 'transparent',
            fontSize:   '13px',
            color:      '#0f0e0c',
            fontWeight: 500,
            fontFamily: 'inherit',
            minWidth:   0,
          }}
        />
      </form>

      {/* Category pills */}
      <div
        className="scrollbar-none"
        style={{ display: 'flex', gap: '8px', padding: '0 16px 16px', overflowX: 'auto' }}
      >
        {CATEGORY_PILLS.map((pill, i) => (
          <a
            key={pill.label}
            href={pill.href}
            style={{
              background:     i === 0 ? '#1a6b4a' : '#fff',
              color:          i === 0 ? '#fff'    : '#6b6055',
              border:         i === 0 ? 'none'    : '1.5px solid #e8e4dc',
              borderRadius:   '20px',
              padding:        '6px 16px',
              fontSize:       '12px',
              fontWeight:     600,
              flexShrink:     0,
              textDecoration: 'none',
              whiteSpace:     'nowrap',
            }}
          >
            {pill.label}
          </a>
        ))}
      </div>

      {/* Featured listings header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c' }}>Featured listings</span>
        <a href="/browse" style={{ fontSize: '12px', color: '#1a6b4a', fontWeight: 600, textDecoration: 'none' }}>
          See all →
        </a>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div style={{
          background: '#fff3cd', borderBottom: '1px solid #f0c040',
          padding: '10px 16px', textAlign: 'center',
          fontSize: '13px', color: '#7a5c00',
        }}>
          Listings temporarily unavailable — database connection issue.{' '}
          <a href="/" style={{ fontWeight: 700, color: '#7a5c00', textDecoration: 'underline' }}>
            Refresh
          </a>
        </div>
      )}

      {/* Main content — HeroSlider, MapSection, StatsBar, NavigationModal */}
      <Suspense fallback={<SkeletonLoader />}>
        <HomeContent properties={properties} stats={stats} dbError={dbError} />
      </Suspense>

      <FeaturesStrip />
      <HowItWorks />

      {/* Map CTA */}
      <a href="/browse/map" style={{
        margin:         '16px 16px 24px',
        background:     '#0f0e0c',
        borderRadius:   '16px',
        padding:        '14px 16px',
        display:        'flex',
        alignItems:     'center',
        gap:            '12px',
        textDecoration: 'none',
      }}>
        <div style={{
          width:           '38px',
          height:          '38px',
          background:      '#1a6b4a',
          borderRadius:    '10px',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
          fontSize:        '20px',
        }}>
          🗺
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '1px' }}>
            Explore on map
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
            All GPS-pinned properties
          </div>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px' }}>›</span>
      </a>

      <Footer />
    </div>
  )
}
