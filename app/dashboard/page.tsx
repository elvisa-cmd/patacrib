import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import ListerNav from '@/components/ui/ListerNav'

export const dynamic = 'force-dynamic'

export default async function ListerDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.userId) redirect('/login')

  const userId = session.user.userId

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, name: true, email: true, phone: true, userType: true },
  })
  if (!user) redirect('/login')

  // Only ADMIN (lister) accounts see this page — seekers go to their own dashboard
  if (user.userType === 'SEEKER') redirect('/dashboard/seeker')

  const [myProperties, trendingProperties] = await Promise.all([
    prisma.property.findMany({
      where:   { adminId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { views: true, enquiries: true },
    }),
    prisma.property.findMany({
      where:   { status: 'available', NOT: { adminId: user.id } },
      orderBy: { createdAt: 'desc' },
      take:    8,
    }),
  ])

  const now     = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const totalListings        = myProperties.length
  const activeListings       = myProperties.filter(p => p.status === 'available').length
  const propertiesWithVideos = myProperties.filter(p => p.videoUrl).length
  const totalRent            = myProperties.reduce((s, p) => s + (p.price || 0), 0)

  const totalViews     = myProperties.reduce((s, p) => s + p.views.length, 0)
  const weekViews      = myProperties.reduce((s, p) => s + p.views.filter(v => v.viewedAt > weekAgo).length, 0)
  const totalWhatsApp  = myProperties.reduce((s, p) => s + p.enquiries.filter(e => e.type === 'whatsapp').length, 0)
  const weekWhatsApp   = myProperties.reduce((s, p) => s + p.enquiries.filter(e => e.type === 'whatsapp' && e.createdAt > weekAgo).length, 0)
  const totalDirections = myProperties.reduce((s, p) => s + p.enquiries.filter(e => e.type === 'directions').length, 0)
  const weekDirections  = myProperties.reduce((s, p) => s + p.enquiries.filter(e => e.type === 'directions' && e.createdAt > weekAgo).length, 0)
  const totalSaves      = myProperties.reduce((s, p) => s + p.enquiries.filter(e => e.type === 'save').length, 0)

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.name?.split(' ')[0] || 'there'

  function statusStyle(status: string | null) {
    const s = (status || '').toLowerCase()
    if (s === 'available') return { bg: 'rgba(26,107,74,0.1)',  color: '#1a6b4a', label: 'Active'  }
    if (s === 'taken')     return { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', label: 'Rented'  }
    return                        { bg: '#f5f5f5',               color: '#888',    label: status || 'Active' }
  }

  return (
    <div style={{ background: '#f4f6f9', minHeight: '100vh', paddingBottom: '100px' }}>
      <ListerNav />

      {/* ── Dark header ──────────────────────────────────────────── */}
      <div style={{ background: '#0d0d0d', padding: '20px 20px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '2px' }}>{greeting}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{firstName}</div>
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span style={{
                background: '#1a6b4a', color: '#fff', fontSize: '9px', fontWeight: 700,
                padding: '2px 7px', borderRadius: '20px',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                Lister
              </span>
              Pata<span style={{ color: '#4dbe87' }}>Krib</span> portal
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!user.phone && (
              <Link href="/dashboard/profile" style={{
                fontSize: '11px', fontWeight: 700, color: '#e8a020',
                background: 'rgba(232,160,32,0.12)', border: '1px solid rgba(232,160,32,0.2)',
                borderRadius: '20px', padding: '5px 12px', textDecoration: 'none',
              }}>
                ⚠️ Add WhatsApp
              </Link>
            )}
            <Link href="/dashboard/add" style={{
              background: '#1a6b4a', color: '#fff', padding: '8px 16px',
              borderRadius: '20px', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              + List
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { n: totalListings,                                l: 'Total listings'     },
            { n: activeListings,                               l: 'Active now'         },
            { n: propertiesWithVideos,                         l: 'With video tours'   },
            { n: totalRent > 0 ? `${Math.round(totalRent / 1000)}K` : '0', l: 'Rent /mo potential' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px', padding: '14px',
            }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#4dbe87', letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>
                {s.n}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px' }}>

        {/* Analytics — prominent card */}
        <div style={{
          background: '#fff', borderRadius: '20px',
          overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: '24px',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #f8f8f8',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>
              Your performance
            </div>
            <div style={{
              fontSize: '10px', fontWeight: 600, color: '#aaa',
              background: '#f5f5f5', padding: '3px 10px', borderRadius: '20px',
            }}>
              All time
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#f8f8f8' }}>
            {[
              { icon: '👁',  n: totalViews,      l: 'Property views',     sub: weekViews      > 0 ? `+${weekViews} this week`      : 'No views yet',    good: weekViews      > 0 },
              { icon: '📲', n: totalWhatsApp,   l: 'WhatsApp enquiries', sub: weekWhatsApp   > 0 ? `+${weekWhatsApp} this week`   : 'None yet',         good: weekWhatsApp   > 0 },
              { icon: '🗺',  n: totalDirections, l: 'Directions tapped',  sub: weekDirections > 0 ? `+${weekDirections} this week` : 'None yet',         good: weekDirections > 0 },
              { icon: '❤️', n: totalSaves,      l: 'Saved by renters',   sub: totalSaves     > 0 ? `${totalSaves} renters saved`  : 'None yet',         good: totalSaves     > 0 },
            ].map((a, i) => (
              <div key={i} style={{ background: '#fff', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{a.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#aaa' }}>{a.l}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>
                  {a.n}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: a.good ? '#1a6b4a' : '#ccc' }}>
                  {a.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Insight */}
          <div style={{ padding: '12px 16px', background: '#fafafa', borderTop: '1px solid #f5f5f5', fontSize: '12px', color: '#888', lineHeight: 1.5 }}>
            {totalViews === 0
              ? '💡 No views yet. Share your listing on WhatsApp to get your first viewers.'
              : totalWhatsApp === 0
              ? `💡 ${totalViews} people viewed your listing but nobody tapped WhatsApp yet. Make sure your WhatsApp number is added.`
              : `💡 ${Math.round((totalWhatsApp / totalViews) * 100)}% of viewers contacted you. ${totalWhatsApp / totalViews > 0.1 ? 'Great conversion rate!' : 'Try improving your photos and description.'}`
            }
          </div>
        </div>

        {/* My listings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>My listings</div>
          <Link href="/dashboard/add" style={{ fontSize: '12px', fontWeight: 700, color: '#1a6b4a', textDecoration: 'none' }}>
            + Add new
          </Link>
        </div>

        {myProperties.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px 20px',
            textAlign: 'center', border: '1px solid #f0f0f0', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏠</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0d0d0d', marginBottom: '6px' }}>No listings yet</div>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '16px', lineHeight: 1.5 }}>
              List your first property and reach renters across Nairobi
            </p>
            <Link href="/dashboard/add" style={{
              display: 'inline-block', background: '#0d0d0d', color: '#fff',
              padding: '12px 28px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            }}>
              List a property
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {myProperties.map(p => {
              const st          = statusStyle(p.status)
              const propViews   = p.views.length
              const propWa      = p.enquiries.filter(e => e.type === 'whatsapp').length
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>

                  {/* Main row */}
                  <div style={{ display: 'flex', gap: '12px', padding: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden',
                      flexShrink: 0, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.images?.[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '26px', opacity: 0.3 }}>🏠</span>
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: 700, color: '#0d0d0d', marginBottom: '2px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px',
                      }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a6b4a', marginBottom: '6px', letterSpacing: '-0.3px' }}>
                        KSh {p.price?.toLocaleString('en-KE')}
                        <span style={{ fontSize: '11px', fontWeight: 400, color: '#bbb' }}>/mo</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 9px',
                          borderRadius: '20px', background: st.bg, color: st.color,
                        }}>
                          {st.label}
                        </span>
                        {p.latitude && p.longitude && (
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#1a6b4a' }}>📍 GPS</span>
                        )}
                        {p.videoUrl && (
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6366f1' }}>🎥 Tour</span>
                        )}
                        {propViews > 0 && (
                          <span style={{ fontSize: '9px', color: '#aaa', fontWeight: 500 }}>👁 {propViews}</span>
                        )}
                        {propWa > 0 && (
                          <span style={{ fontSize: '9px', color: '#128C7E', fontWeight: 500 }}>📲 {propWa}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <Link href={`/property/${p.id}`} style={{
                        width: '32px', height: '32px', background: '#f5f5f5', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '15px',
                      }}>👁</Link>
                      <Link href={`/dashboard/edit/${p.id}`} style={{
                        width: '32px', height: '32px', background: '#f5f5f5', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '15px',
                      }}>✏️</Link>
                    </div>
                  </div>

                  {/* Inline video */}
                  {p.videoUrl && (
                    <div style={{ borderTop: '1px solid #f5f5f5', padding: '12px 14px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 700, color: '#6366f1', marginBottom: '8px',
                        textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        🎥 Virtual tour
                      </div>
                      <video
                        src={p.videoUrl}
                        controls playsInline preload="metadata"
                        poster={p.images?.[0] ?? undefined}
                        style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', background: '#0d0d0d', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Share row */}
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 14px', display: 'flex', gap: '8px' }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`🏠 *${p.title}*\n📍 ${p.estate || p.city || 'Nairobi'}\n💰 KSh ${p.price?.toLocaleString('en-KE')}/mo\n✅ GPS verified on PataKrib\n\nhttps://patacrib.vercel.app/property/${p.id}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1, padding: '9px 0',
                        background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)',
                        borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                        color: '#128C7E', textDecoration: 'none', textAlign: 'center',
                      }}
                    >
                      📤 Share on WhatsApp
                    </a>
                    <Link href={`/property/${p.id}`} style={{
                      flex: 1, padding: '9px 0', background: '#f5f5f5', borderRadius: '10px',
                      fontSize: '12px', fontWeight: 700, color: '#0d0d0d', textDecoration: 'none', textAlign: 'center',
                    }}>
                      View listing
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Trending */}
        {trendingProperties.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>Trending in Nairobi</div>
              <Link href="/browse" style={{ fontSize: '12px', fontWeight: 600, color: '#1a6b4a', textDecoration: 'none' }}>See all →</Link>
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {trendingProperties.map(p => (
                <Link key={p.id} href={`/property/${p.id}`} style={{
                  flexShrink: 0, width: '170px', background: '#fff', borderRadius: '16px',
                  overflow: 'hidden', border: '1px solid #f0f0f0', textDecoration: 'none',
                }}>
                  <div style={{
                    height: '95px', background: '#f5f5f5', position: 'relative',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {p.images?.[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '30px', opacity: 0.3 }}>🏠</span>
                    }
                    {p.videoUrl && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: '#6366f1', color: '#fff', fontSize: '9px', fontWeight: 700,
                        padding: '2px 6px', borderRadius: '20px',
                      }}>🎥</div>
                    )}
                  </div>
                  <div style={{ padding: '10px 11px 12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a6b4a', letterSpacing: '-0.4px', marginBottom: '2px' }}>
                      {Math.round((p.price || 0) / 1000)}K
                      <span style={{ fontSize: '10px', fontWeight: 400, color: '#ccc' }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: '#555', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#bbb' }}>📍 {p.estate || p.city || 'Nairobi'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Quick links */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { href: '/dashboard/add',     icon: '🏠', title: 'List a new property',     sub: 'Add photos, GPS location and intelligence data' },
            { href: '/dashboard/profile', icon: '📱', title: user.phone ? 'Update WhatsApp number' : 'Add WhatsApp number', sub: user.phone ?? 'Required for renters to contact you' },
            { href: '/browse',            icon: '🗺', title: 'Browse all listings',      sub: 'See how your property compares' },
          ].map(({ href, icon, title, sub }) => (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
              background: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', textDecoration: 'none',
            }}>
              <span style={{ fontSize: '22px' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d0d0d' }}>{title}</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>{sub}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#ccc' }}>→</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
