import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AddPropertyForm from '@/components/dashboard/AddPropertyForm'
import IOSInstallGate from '@/components/shared/IOSInstallGate'

export default async function AddPropertyPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.userType !== 'ADMIN') redirect('/dashboard')

  return (
    <IOSInstallGate>
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>

      {/* Green header */}
      <div style={{
        background:   '#1a6b4a',
        padding:      '20px 16px 28px',
        position:     'relative',
      }}>
        {/* Back button */}
        <div style={{ marginBottom: '16px' }}>
          <a href="/dashboard" style={{
            display:              'inline-flex',
            alignItems:           'center',
            justifyContent:       'center',
            width:                '36px',
            height:               '36px',
            background:           'rgba(255,255,255,0.15)',
            border:               '1px solid rgba(255,255,255,0.3)',
            borderRadius:         '10px',
            textDecoration:       'none',
            backdropFilter:       'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            <svg width="16" height="16" fill="none" stroke="#ffffff" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          List your property
        </h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontWeight: 500 }}>
          Step 1 of 3 — Property details
        </p>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                flex:         1,
                height:       '4px',
                borderRadius: '4px',
                background:   i === 0 ? '#4dbe87' : i === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>

      <main>
        <AddPropertyForm />
      </main>
    </div>
    </IOSInstallGate>
  )
}
