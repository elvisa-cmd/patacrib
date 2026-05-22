'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function ListerNav() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{
      position:             'sticky',
      top:                  0,
      zIndex:               50,
      background:           'rgba(13,13,13,0.97)',
      backdropFilter:       'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:         '1px solid rgba(255,255,255,0.06)',
      padding:              '12px 20px',
      display:              'flex',
      alignItems:           'center',
      justifyContent:       'space-between',
    }}>

      {/* Logo — goes to lister dashboard, not homepage */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '28px', height: '28px',
          background: '#1a6b4a', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 800, color: '#fff',
        }}>
          P
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
            Pata<span style={{ color: '#4dbe87' }}>Krib</span>
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, marginTop: '2px' }}>
            Lister portal
          </div>
        </div>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        <Link href="/dashboard/add" style={{
          background: '#1a6b4a', color: '#fff',
          padding: '7px 14px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 700, textDecoration: 'none',
        }}>
          + List
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: '34px', height: '34px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '18px',
          }}
        >
          👤
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{
            position: 'absolute', top: '42px', right: 0,
            background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px', overflow: 'hidden', minWidth: '180px',
            zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                {session?.user?.name || 'Lister'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                {session?.user?.email}
              </div>
            </div>
            {[
              { label: '📊 Dashboard',   href: '/dashboard' },
              { label: '📱 Profile',     href: '/dashboard/profile' },
              { label: '🗺 Browse',      href: '/browse' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '11px 14px',
                  fontSize: '13px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                display: 'block', width: '100%', padding: '11px 14px',
                fontSize: '13px', fontWeight: 600,
                color: '#dc2626', background: 'none',
                border: 'none', textAlign: 'left',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🚪 Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
