import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Nav from '@/components/home/Nav'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.userId },
    select: { id: true, name: true, email: true, phone: true },
  })

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 16px 100px' }}>
        <a
          href="/dashboard"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '6px',
            fontSize:       '13px',
            color:          '#6b6055',
            textDecoration: 'none',
            marginBottom:   '24px',
          }}
        >
          ← Back to dashboard
        </a>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f0e0c', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          My Profile
        </h1>
        <p style={{ fontSize: '13px', color: '#6b6055', marginBottom: '28px' }}>
          Add your WhatsApp number so renters can contact you directly.
        </p>

        <form action="/api/profile" method="POST">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b6055', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Full name
              </label>
              <input
                name="name"
                defaultValue={user?.name ?? ''}
                placeholder="Your full name"
                style={{ width: '100%', padding: '13px 14px', background: '#f5f5f5', border: '1px solid transparent', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b6055', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                WhatsApp number
              </label>
              <input
                name="phone"
                defaultValue={user?.phone ?? ''}
                placeholder="e.g. 0712345678"
                type="tel"
                style={{ width: '100%', padding: '13px 14px', background: '#f5f5f5', border: '1px solid transparent', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: '11px', color: '#9b8e84', marginTop: '6px', lineHeight: 1.5 }}>
                Renters will contact you on this number via WhatsApp. Stored as 254XXXXXXXXX format.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b6055', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Email
              </label>
              <input
                value={user?.email ?? ''}
                disabled
                style={{ width: '100%', padding: '13px 14px', background: '#f0eeeb', border: '1px solid transparent', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', color: '#9b8e84', boxSizing: 'border-box' }}
                readOnly
              />
            </div>

            <button
              type="submit"
              style={{ background: '#1a6b4a', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
            >
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
