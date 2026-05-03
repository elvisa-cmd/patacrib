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
    <div className="min-h-screen bg-bg">
      <Nav />

      <main className="pt-[60px] px-16 py-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between pb-7 mb-8 border-b border-border">
          <div>
            <h1 className="font-serif text-[28px] text-ink leading-tight">
              {greeting}, {session.user.name ?? 'Landlord'}
            </h1>
            <p className="font-sans font-light text-[14px] text-muted mt-1">
              Here is your PataKrib dashboard
            </p>
          </div>
          <a
            href="/dashboard/add"
            className="bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-[0.5px] px-5 py-2.5 hover:bg-accent-d transition-colors"
          >
            + Add Property
          </a>
        </div>

        {/* ── Stats cards ─────────────────────────────────────────────────── */}
        <StatsCards stats={stats} />

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
