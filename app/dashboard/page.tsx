import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function ListerDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  if (session.user.userType === 'SEEKER') redirect('/dashboard/seeker')

  const userId = session.user.userId

  const [user, myProperties, trendingProperties] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    }),
    prisma.property.findMany({
      where:   { adminId: userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.findMany({
      where:   { status: 'available', NOT: { adminId: userId } },
      orderBy: { createdAt: 'desc' },
      take:    6,
    }),
  ])

  const totalListings         = myProperties.length
  const activeListings        = myProperties.filter(p => p.status === 'available').length
  const propertiesWithVideos  = myProperties.filter(p => p.videoUrl).length
  const totalRentPotential    = myProperties.reduce((sum, p) => sum + (p.price || 0), 0)

  function statusStyle(status: string): { bg: string; color: string } {
    switch (status?.toLowerCase()) {
      case 'available': return { bg: 'rgba(26,107,74,0.1)',  color: '#1a6b4a' }
      case 'taken':     return { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' }
      default:          return { bg: '#f5f5f5',               color: '#888'    }
    }
  }

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div style={{ background: '#f4f6f9', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'inherit' }}>

      {/* ── Dark header ──────────────────────────────────────────────── */}
      <div style={{ background: '#0d0d0d', padding: '20px 20px 24px' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px', letterSpacing: '0.02em' }}>
              {greeting}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              {firstName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard/profile" style={{
              width: '38px', height: '38px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '18px' }}>👤</span>
            </Link>
            <Link href="/dashboard/add" style={{
              height: '38px', padding: '0 14px',
              background: '#1a6b4a',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '13px', fontWeight: 700, color: '#fff', gap: '6px',
            }}>
              + List property
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { n: totalListings,                                            l: 'Total listings'      },
            { n: activeListings,                                           l: 'Active now'          },
            { n: propertiesWithVideos,                                     l: 'With video tours'    },
            { n: `${Math.round(totalRentPotential / 1000)}K`,             l: 'Rent potential /mo'  },
          ].map((s, i) => (
            <div key={i} style={{
              background:   'rgba(255,255,255,0.06)',
              border:       '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding:      '14px',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#4dbe87', letterSpacing: '-0.8px', marginBottom: '3px', lineHeight: 1 }}>
                {s.n}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* No phone warning */}
        {!user?.phone && (
          <Link href="/dashboard/profile" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginTop: '12px', padding: '12px 14px',
            background: 'rgba(232,160,32,0.12)',
            border: '1px solid rgba(232,160,32,0.25)',
            borderRadius: '12px',
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8a020' }}>Add your WhatsApp number</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                Renters cannot contact you without it
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px' }}>→</span>
          </Link>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px' }}>

        {/* My listings header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>
            My listings
          </div>
          <Link href="/dashboard/add" style={{ fontSize: '12px', fontWeight: 700, color: '#1a6b4a', textDecoration: 'none' }}>
            + Add new
          </Link>
        </div>

        {myProperties.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px 20px',
            textAlign: 'center', border: '1px solid #f0f0f0', marginBottom: '24px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏠</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0d0d0d', marginBottom: '6px' }}>
              No listings yet
            </div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '16px', lineHeight: 1.5 }}>
              List your first property and reach thousands of renters in Nairobi
            </div>
            <Link href="/dashboard/add" style={{
              display: 'inline-block', background: '#0d0d0d', color: '#fff',
              padding: '12px 24px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            }}>
              List a property
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {myProperties.map(p => {
              const ss       = statusStyle(p.status || '')
              const videoUrl = p.videoUrl

              return (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: '18px',
                  overflow: 'hidden', border: '1px solid #f0f0f0',
                }}>
                  {/* Property row */}
                  <div style={{ display: 'flex', gap: '12px', padding: '14px', alignItems: 'flex-start' }}>

                    {/* Thumbnail */}
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '12px',
                      background: '#f5f5f5', overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '28px', opacity: 0.4 }}>🏠</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: 700, color: '#0d0d0d',
                        marginBottom: '3px', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px',
                      }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a6b4a', marginBottom: '4px' }}>
                        KSh {p.price?.toLocaleString('en-KE')}/mo
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '20px', background: ss.bg, color: ss.color, textTransform: 'capitalize',
                        }}>
                          {p.status || 'active'}
                        </span>
                        {p.latitude && p.longitude && (
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#1a6b4a' }}>📍 GPS</span>
                        )}
                        {videoUrl && (
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#6366f1' }}>🎥 Tour</span>
                        )}
                      </div>
                    </div>

                    {/* Action icons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <Link href={`/property/${p.id}`} style={{
                        width: '34px', height: '34px', background: '#f5f5f5',
                        borderRadius: '10px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', textDecoration: 'none', fontSize: '16px',
                      }}>
                        👁
                      </Link>
                      <Link href={`/dashboard/edit/${p.id}`} style={{
                        width: '34px', height: '34px', background: '#f5f5f5',
                        borderRadius: '10px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', textDecoration: 'none', fontSize: '16px',
                      }}>
                        ✏️
                      </Link>
                    </div>
                  </div>

                  {/* Inline video tour */}
                  {videoUrl && (
                    <div style={{ borderTop: '1px solid #f5f5f5', padding: '12px 14px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 700, color: '#6366f1',
                        marginBottom: '8px', display: 'flex', alignItems: 'center',
                        gap: '5px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        🎥 Virtual tour
                      </div>
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        style={{
                          width: '100%', height: '160px', objectFit: 'cover',
                          borderRadius: '12px', background: '#0d0d0d', display: 'block',
                        }}
                      />
                    </div>
                  )}

                  {/* Quick share row */}
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 14px', display: 'flex', gap: '8px' }}>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `🏠 ${p.title}\n📍 ${p.estate || p.city || 'Nairobi'}\n💰 KSh ${p.price?.toLocaleString('en-KE')}/mo\n✅ GPS verified on PataKrib\n\nhttps://patacrib.vercel.app/property/${p.id}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1, padding: '9px',
                        background: 'rgba(37,211,102,0.08)',
                        border: '1px solid rgba(37,211,102,0.2)',
                        borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                        color: '#128C7E', textDecoration: 'none', textAlign: 'center',
                      }}
                    >
                      Share on WhatsApp
                    </a>
                    <Link href={`/property/${p.id}`} style={{
                      flex: 1, padding: '9px', background: '#f5f5f5',
                      borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                      color: '#0d0d0d', textDecoration: 'none', textAlign: 'center',
                    }}>
                      View listing
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Trending properties */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>
            Trending in Nairobi
          </div>
          <Link href="/browse" style={{ fontSize: '12px', fontWeight: 600, color: '#1a6b4a', textDecoration: 'none' }}>
            See all →
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {trendingProperties.length === 0 ? (
            <div style={{ padding: '20px', fontSize: '13px', color: '#aaa' }}>No other properties yet</div>
          ) : (
            trendingProperties.map(p => (
              <Link key={p.id} href={`/property/${p.id}`} style={{
                flexShrink: 0, width: '180px',
                background: '#fff', borderRadius: '16px',
                overflow: 'hidden', border: '1px solid #f0f0f0', textDecoration: 'none',
              }}>
                <div style={{
                  height: '100px', background: '#f5f5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '32px', opacity: 0.3 }}>🏠</span>
                  )}
                  {p.latitude && p.longitude && (
                    <div style={{
                      position: 'absolute', bottom: '6px', left: '6px',
                      background: '#1a6b4a', color: '#fff',
                      fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
                    }}>
                      GPS
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a6b4a', letterSpacing: '-0.3px', marginBottom: '2px' }}>
                    {Math.round((p.price || 0) / 1000)}K
                    <span style={{ fontSize: '10px', fontWeight: 400, color: '#ccc' }}>/mo</span>
                  </div>
                  <div style={{
                    fontSize: '11px', fontWeight: 500, color: '#555', marginBottom: '2px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '10px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    📍 {p.estate || p.city || 'Nairobi'}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
