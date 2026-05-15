import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import Nav from '@/components/home/Nav'

export default async function SavedPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userId = session.user.userId

  const saved = await prisma.savedProperty.findMany({
    where:   { userId },
    include: { property: true },
    orderBy: { savedAt: 'desc' },
  }).catch(() => [])

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', paddingBottom: '100px' }}>
      <Nav />

      <div style={{ padding: '16px 16px 12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f0e0c', letterSpacing: '-0.5px', margin: 0 }}>
          Saved properties
        </h1>
        <p style={{ fontSize: '13px', color: '#b0a898', margin: '4px 0 0', fontWeight: 500 }}>
          {saved.length} {saved.length === 1 ? 'property' : 'properties'} saved
        </p>
      </div>

      {saved.length === 0 ? (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>❤️</div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f0e0c', marginBottom: '6px' }}>
            No saved properties yet
          </p>
          <p style={{ fontSize: '13px', color: '#b0a898', marginBottom: '24px' }}>
            Tap the heart icon on any property to save it here
          </p>
          <Link href="/browse" style={{
            display:        'inline-block',
            background:     '#1a6b4a',
            color:          '#fff',
            padding:        '12px 28px',
            borderRadius:   '20px',
            fontSize:       '14px',
            fontWeight:     700,
            textDecoration: 'none',
          }}>
            Browse properties
          </Link>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {saved.map((sp) => {
            const p = sp.property
            if (!p) return null
            return (
              <Link key={sp.id} href={`/property/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background:   '#fff',
                  borderRadius: '18px',
                  overflow:     'hidden',
                  boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
                  border:       '1px solid rgba(0,0,0,0.04)',
                }}>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '120px',
                      background: '#e8f5ed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '40px', opacity: 0.4,
                    }}>
                      🏠
                    </div>
                  )}
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a6b4a', letterSpacing: '-0.5px', marginBottom: '2px' }}>
                      KSh {p.price?.toLocaleString('en-KE')}
                      <span style={{ fontSize: '11px', color: '#b0a898', fontWeight: 400 }}> /mo</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f0e0c', marginBottom: '4px' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#b0a898', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📍 {p.estate || p.city || p.address}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
