import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import StatsCards from '@/components/dashboard/StatsCards'
import PropertiesTable from '@/components/dashboard/PropertiesTable'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import ViewsChart from '@/components/dashboard/ViewsChart'
import PerformanceRow from '@/components/dashboard/PerformanceRow'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.userType !== 'ADMIN') redirect('/dashboard/seeker')

  const userId       = session.user.userId
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [properties, totalViews, unreadMessages, recentViews, weekViews] =
    await Promise.all([
      prisma.property.findMany({
        where:     { adminId: userId },
        orderBy:   { createdAt: 'desc' },
        include:   { _count: { select: { savedBy: true, views: true } } },
      }),
      prisma.propertyView.count({
        where: { property: { adminId: userId } },
      }),
      prisma.message.count({
        where: {
          conversation: { OR: [{ seekerId: userId }, { landlordId: userId }] },
          senderId:     { not: userId },
          read:         false,
        },
      }),
      prisma.propertyView.findMany({
        where:   { property: { adminId: userId } },
        orderBy: { viewedAt: 'desc' },
        take:    8,
        include: { property: { select: { title: true } } },
      }),
      prisma.propertyView.findMany({
        where: {
          property: { adminId: userId },
          viewedAt: { gte: sevenDaysAgo },
        },
      }),
    ])

  // ── Derived stats (computed once here, never re-derived in children) ──────
  const stats = {
    total:          properties.length,
    available:      properties.filter(p => p.status === 'available').length,
    rented:         properties.filter(p => p.status === 'taken').length,
    totalViews,
    unreadMessages,
  }

  const mostViewed = properties.length > 0
    ? properties.reduce((a, b) => b._count.views   > a._count.views   ? b : a)
    : null
  const mostSaved  = properties.length > 0
    ? properties.reduce((a, b) => b._count.savedBy > a._count.savedBy ? b : a)
    : null

  // ── Views per day Mon–Sun for chart ───────────────────────────────────────
  // JS getDay(): 0=Sun 1=Mon … 6=Sat → chart index i maps to getDay() (i+1)%7
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const viewsByDay = DAY_LABELS.map((day, i) => ({
    day,
    count: weekViews.filter(v => v.viewedAt.getDay() === (i + 1) % 7).length,
  }))

  // ── Time-of-day greeting ──────────────────────────────────────────────────
  const hour     = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>
      <Nav />

      {/* Dark header */}
      <div style={{ background: '#0f1a12', padding: '24px 16px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Pata<span style={{ color: '#4dbe87' }}>Krib</span>
          </span>
          <a href="/dashboard/add" style={{
            background: '#1a6b4a', color: '#fff',
            padding: '8px 18px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 700,
            textDecoration: 'none',
          }}>
            + Add Property
          </a>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 500 }}>
          {greeting} 👋
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
          {session.user.name ?? 'Landlord'}
        </h1>

        {/* 2×2 stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { value: stats.available,      label: 'Active listings' },
            { value: stats.totalViews,     label: 'Total views' },
            { value: stats.unreadMessages, label: 'Enquiries',        highlight: stats.unreadMessages > 0 },
            { value: stats.rented,         label: 'Rented out' },
          ].map(({ value, label, highlight }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: '#4dbe87', margin: '0 0 4px' }}>
                {value}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <main className="px-4 md:px-16 py-8">

        {/* ── Stats cards (desktop only, mobile uses dark header above) ──── */}
        <div className="hidden md:block mb-8">
          <StatsCards stats={stats} />
        </div>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>

          {/* Left — properties table */}
          <PropertiesTable properties={properties} />

          {/* Right — sidebar */}
          <div>
            <QuickActions
              unreadMessages={unreadMessages}
              adminId={userId}
            />
            <RecentActivity views={recentViews} />
            <ViewsChart data={viewsByDay} />
          </div>

        </div>

        {/* ── Performance row ──────────────────────────────────────────────── */}
        <PerformanceRow mostViewed={mostViewed} mostSaved={mostSaved} />

      </main>
    </div>
  )
}
