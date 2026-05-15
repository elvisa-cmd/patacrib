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

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <main className="min-h-screen" style={{ background: '#faf8f5' }}>
      <Nav />

      {/* Dark header */}
      <div style={{
        background:   '#0f1a12',
        padding:      '24px 16px 28px',
        marginBottom: '0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            Pata<span style={{ color: '#4dbe87' }}>Krib</span>
          </span>
          <a href="/dashboard/messages" style={{ position: 'relative', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              🔔
            </div>
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '16px', height: '16px',
                background: '#1a6b4a', borderRadius: '50%',
                fontSize: '9px', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700,
              }}>
                {unreadCount}
              </div>
            )}
          </a>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontWeight: 500 }}>
          {greeting} 👋
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 20px', letterSpacing: '-0.5px' }}>
          {session.user.name ?? 'Welcome back'}
        </h1>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { value: savedProperties.length, label: 'Saved properties' },
            { value: unreadCount,             label: 'Unread messages',  highlight: unreadCount > 0 },
            { value: recentViews.length,      label: 'Properties viewed' },
            { value: conversations.length,    label: 'Active chats' },
          ].map(({ value, label, highlight }) => (
            <div key={label} style={{
              background:   'rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding:      '14px',
              border:       '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontSize: '26px', fontWeight: 700, color: highlight ? '#4dbe87' : '#4dbe87', margin: '0 0 4px' }}>
                {value}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px' }}>

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c', letterSpacing: '-0.2px' }}>My Properties</span>
          <a href="/browse" style={{ fontSize: '12px', color: '#1a6b4a', fontWeight: 600, textDecoration: 'none' }}>Browse more →</a>
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

      </div>{/* /body */}
      <Footer />
    </main>
  )
}
