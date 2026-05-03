import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import SeekerStats from '@/components/seeker/SeekerStats'
import SavedProperties from '@/components/seeker/SavedProperties'
import RecentMessages from '@/components/seeker/RecentMessages'
import RecentlyViewed from '@/components/seeker/RecentlyViewed'
import Recommendations from '@/components/seeker/Recommendations'
import type { SavedItem } from '@/components/seeker/SavedProperties'

export default async function SeekerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session)                              redirect('/login')
  if (session.user.userType === 'ADMIN')     redirect('/dashboard/admin')

  const userId = session.user.userId

  const [savedProperties, conversations, recentViews] = await Promise.all([
    prisma.savedProperty.findMany({
      where:   { userId },
      include: { property: true },
      orderBy: { savedAt: 'desc' },
    }),
    prisma.conversation.findMany({
      where: { seekerId: userId },
      include: {
        property: { select: { id: true, title: true } },
        landlord: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.propertyView.findMany({
      where:    { userId },
      include:  { property: { select: { id: true, title: true, price: true, priceType: true, estate: true, images: true } } },
      orderBy:  { viewedAt: 'desc' },
      take: 8,
      distinct: ['propertyId'],
    }),
  ])

  const unreadCount = await prisma.message.count({
    where: {
      conversation: { seekerId: userId },
      senderId:     { not: userId },
      read:         false,
    },
  })

  // Recommendations: same estate as first saved, excluding already saved
  let recommended: Awaited<ReturnType<typeof prisma.property.findMany>> = []
  const firstEstate = savedProperties[0]?.property.estate
  if (firstEstate) {
    recommended = await prisma.property.findMany({
      where: {
        status: 'available',
        estate: firstEstate,
        id:     { notIn: savedProperties.map(s => s.propertyId) },
      },
      take: 3,
    })
  }
  if (recommended.length === 0) {
    recommended = await prisma.property.findMany({
      where:   { status: 'available' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })
  }

  // ── Serialize for client components ───────────────────────────────────────

  const serializedSaved: SavedItem[] = savedProperties.map(sp => ({
    id:         sp.id,
    propertyId: sp.propertyId,
    savedAt:    sp.savedAt.toISOString(),
    property: {
      id:            sp.property.id,
      title:         sp.property.title,
      description:   sp.property.description,
      price:         sp.property.price,
      priceType:     sp.property.priceType,
      bedrooms:      sp.property.bedrooms,
      bathrooms:     sp.property.bathrooms,
      propertyType:  sp.property.propertyType,
      address:       sp.property.address,
      estate:        sp.property.estate,
      city:          sp.property.city,
      latitude:      sp.property.latitude,
      longitude:     sp.property.longitude,
      images:        sp.property.images,
      status:        sp.property.status,
      createdAt:     sp.property.createdAt.toISOString(),
      safetyScore:   sp.property.safetyScore,
      matatuRoutes:  sp.property.matatuRoutes,
      waterSchedule: sp.property.waterSchedule,
      powerBackup:   sp.property.powerBackup,
      borehole:      sp.property.borehole,
    },
  }))

  const serializedConvs = conversations.map(c => ({
    id:         c.id,
    propertyId: c.propertyId,
    updatedAt:  c.updatedAt.toISOString(),
    property:   c.property,
    landlord:   c.landlord,
    messages:   c.messages.map(m => ({
      id:        m.id,
      content:   m.content,
      createdAt: m.createdAt.toISOString(),
      read:      m.read,
      senderId:  m.senderId,
    })),
  }))

  const serializedViews = recentViews.map(v => ({
    id:         v.id,
    propertyId: v.propertyId,
    viewedAt:   v.viewedAt.toISOString(),
    property:   v.property,
  }))

  const serializedRecs = recommended.map(p => ({
    id:            p.id,
    title:         p.title,
    description:   p.description,
    price:         p.price,
    priceType:     p.priceType,
    bedrooms:      p.bedrooms,
    bathrooms:     p.bathrooms,
    propertyType:  p.propertyType,
    address:       p.address,
    estate:        p.estate,
    city:          p.city,
    latitude:      p.latitude,
    longitude:     p.longitude,
    images:        p.images,
    status:        p.status,
    createdAt:     p.createdAt.toISOString(),
    safetyScore:   p.safetyScore,
    matatuRoutes:  p.matatuRoutes,
    waterSchedule: p.waterSchedule,
    powerBackup:   p.powerBackup,
    borehole:      p.borehole,
  }))

  return (
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[60px] px-16 py-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between pb-7 mb-8 border-b border-border">
          <div>
            <h1 className="font-serif text-[28px] text-ink leading-tight">
              Welcome back, {session.user.name ?? 'there'}
            </h1>
            <p className="font-sans font-light text-[14px] text-muted mt-1">
              Here are your saved properties and messages
            </p>
          </div>
          <a
            href="/browse"
            className="bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-[0.5px] px-5 py-2.5 hover:bg-accent-d transition-colors"
          >
            🔍 Browse properties
          </a>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <SeekerStats
          savedCount={savedProperties.length}
          conversationCount={conversations.length}
          unreadCount={unreadCount}
          viewCount={recentViews.length}
        />

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>

          {/* Left — saved properties */}
          <SavedProperties initialItems={serializedSaved} />

          {/* Right — messages + recently viewed */}
          <div>
            <RecentMessages
              conversations={serializedConvs}
              userId={userId}
              unreadCount={unreadCount}
            />
            <RecentlyViewed views={serializedViews} />
          </div>

        </div>

        {/* ── Recommendations ─────────────────────────────────────────────── */}
        <Recommendations properties={serializedRecs} />

        {/* ── Search shortcut ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-6 mt-6 px-8 py-7 border"
          style={{ background: 'var(--color-accent-l)', borderColor: 'rgba(26,107,74,0.2)' }}
        >
          <span className="text-[32px] flex-shrink-0" aria-hidden="true">🔍</span>
          <div className="flex-1 min-w-0 px-2">
            <p className="font-sans font-bold text-[16px] text-ink mb-0.5">
              Find your perfect home in Nairobi
            </p>
            <p className="font-sans font-light text-[13px] text-muted">
              Search by estate, price, bedrooms, matatu routes and more
            </p>
          </div>
          <a
            href="/browse"
            className="flex-shrink-0 bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-[0.5px] px-5 py-2.5 hover:bg-accent-d transition-colors whitespace-nowrap"
          >
            Browse all properties →
          </a>
        </div>

      </main>
    </div>
  )
}
