import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'
import Footer from '@/components/home/Footer'

export default async function SeekerDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.userType === 'ADMIN') redirect('/dashboard/admin')

  const userId = session.user.userId

  let savedProperties: any[] = []
  let conversations:   any[] = []
  let recentViews:     any[] = []
  let unreadCount      = 0
  let recommendations: any[] = []

  try {
    const [saved, convos, views, unread] = await Promise.all([
      prisma.savedProperty.findMany({
        where:   { userId },
        include: { property: true },
        orderBy: { savedAt: 'desc' },
      }).catch(() => []),

      prisma.conversation.findMany({
        where:   { seekerId: userId },
        include: {
          property: true,
          landlord: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        take:    5,
      }).catch(() => []),

      prisma.propertyView.findMany({
        where:    { userId },
        include:  { property: true },
        orderBy:  { viewedAt: 'desc' },
        take:     8,
        distinct: ['propertyId'],
      }).catch(() => []),

      prisma.message.count({
        where: {
          conversation: { seekerId: userId },
          senderId:     { not: userId },
          read:         false,
        },
      }).catch(() => 0),
    ])

    savedProperties = saved
    conversations   = convos
    recentViews     = views
    unreadCount     = unread

    const savedEstates = saved.map((s: any) => s.property?.estate).filter(Boolean)
    const savedIds     = saved.map((s: any) => s.propertyId)

    recommendations = await prisma.property.findMany({
      where: {
        status: 'available',
        ...(savedEstates.length > 0 && { estate: { in: savedEstates as string[] } }),
        ...(savedIds.length > 0    && { id:     { notIn: savedIds } }),
      },
      take:    3,
      orderBy: { createdAt: 'desc' },
    }).catch(() => [])

    if (recommendations.length === 0) {
      recommendations = await prisma.property.findMany({
        where:   { status: 'available' },
        orderBy: { createdAt: 'desc' },
        take:    3,
      }).catch(() => [])
    }
  } catch (error) {
    console.error('Seeker dashboard error:', error)
  }

  return (
    <main className="min-h-screen bg-bg">
      <Nav />
      <div className="pt-[60px] px-4 md:px-16 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
          <div>
            <h1 className="font-serif text-3xl text-ink">
              Welcome back, {session.user.name}
            </h1>
            <p className="text-muted text-sm mt-1">Your saved properties and messages</p>
          </div>
          <a
            href="/browse"
            className="bg-accent text-white font-bold uppercase tracking-wide px-5 py-3 text-sm hover:bg-accent-d transition-colors"
          >
            Browse properties
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-ink text-white p-6">
            <p className="font-serif text-4xl font-bold">{savedProperties.length}</p>
            <p className="text-white/40 text-xs uppercase tracking-wide mt-1">Saved properties</p>
          </div>
          <div className="bg-white border border-border p-6">
            <p className={`font-serif text-4xl font-bold ${unreadCount > 0 ? 'text-accent' : 'text-ink'}`}>
              {unreadCount}
            </p>
            <p className="text-muted text-xs uppercase tracking-wide mt-1">Unread messages</p>
          </div>
          <div className="bg-white border border-border p-6">
            <p className="font-serif text-4xl font-bold text-ink">{recentViews.length}</p>
            <p className="text-muted text-xs uppercase tracking-wide mt-1">Properties viewed</p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">

          {/* Saved properties */}
          <div className="bg-white border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-ink uppercase tracking-wide">Saved Properties</h2>
              <a href="/browse" className="text-accent text-xs font-bold">Browse more →</a>
            </div>

            {savedProperties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">♡</p>
                <p className="font-bold text-ink mb-2">No saved properties yet</p>
                <p className="text-muted text-sm mb-4">Browse and save properties you like</p>
                <a
                  href="/browse"
                  className="bg-accent text-white font-bold text-xs uppercase tracking-wide px-4 py-2 inline-block"
                >
                  Browse properties
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedProperties.map((sp: any) => (
                  <a
                    key={sp.id}
                    href={`/property/${sp.property?.id}`}
                    className="border border-border hover:border-accent transition-colors block"
                  >
                    {sp.property?.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sp.property.images[0]}
                        alt={sp.property.title}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="text-xs text-accent font-bold uppercase tracking-wide">
                        {sp.property?.estate}
                      </p>
                      <p className="font-bold text-sm text-ink truncate">{sp.property?.title}</p>
                      <p className="font-serif text-lg text-ink mt-1">
                        KSh {((sp.property?.price || 0) / 1000).toFixed(0)}K
                        <span className="text-xs text-muted font-sans">/mo</span>
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Messages */}
            <div className="bg-white border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-ink uppercase tracking-wide">Messages</h2>
                <a href="/dashboard/messages" className="text-accent text-xs font-bold">View all →</a>
              </div>

              {conversations.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv: any) => (
                    <a
                      key={conv.id}
                      href="/dashboard/messages"
                      className="flex items-center gap-3 hover:bg-surface2 p-2 transition-colors block"
                    >
                      <div className="w-8 h-8 bg-accent text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {conv.landlord?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-ink truncate">{conv.landlord?.name}</p>
                        <p className="text-xs text-accent truncate">{conv.property?.title}</p>
                        <p className="text-xs text-muted truncate">
                          {conv.messages?.[0]?.content || 'No messages'}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Recently viewed */}
            <div className="bg-white border border-border p-4">
              <h2 className="font-bold text-sm text-ink uppercase tracking-wide mb-3">Recently Viewed</h2>

              {recentViews.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">No properties viewed yet</p>
              ) : (
                <div className="space-y-3">
                  {recentViews.map((view: any) => (
                    <a
                      key={view.id}
                      href={`/property/${view.property?.id}`}
                      className="flex items-center gap-3 hover:bg-surface2 p-2 transition-colors block"
                    >
                      <div className="w-10 h-8 bg-surface2 flex-shrink-0 overflow-hidden">
                        {view.property?.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={view.property.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">🏠</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-ink truncate">{view.property?.title}</p>
                        <p className="text-xs text-muted">
                          KSh {((view.property?.price || 0) / 1000).toFixed(0)}K/mo
                        </p>
                      </div>
                      <span className="text-accent text-xs font-bold flex-shrink-0">View →</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-2xl italic text-ink mb-4">Recommended for you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendations.map((p: any) => (
                <a
                  key={p.id}
                  href={`/property/${p.id}`}
                  className="border border-border hover:border-accent transition-colors block"
                >
                  {p.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-xs text-accent font-bold uppercase tracking-wide mb-1">{p.estate}</p>
                    <p className="font-bold text-sm text-ink mb-2 truncate">{p.title}</p>
                    <p className="font-serif text-xl text-ink">
                      KSh {(p.price / 1000).toFixed(0)}K
                      <span className="text-xs text-muted font-sans">/mo</span>
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  )
}
