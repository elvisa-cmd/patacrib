import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AddPropertyForm from '@/components/dashboard/AddPropertyForm'
import BackButton from '@/components/ui/BackButton'

export default async function AddPropertyPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.userType !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#faf8f5' }}>

      {/* Green header */}
      <div style={{
        background:   '#1a6b4a',
        padding:      '20px 16px 28px',
        position:     'relative',
      }}>
        {/* Back button */}
        <div style={{ marginBottom: '16px' }}>
          <BackButton href="/dashboard/admin" />
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
  )
}
