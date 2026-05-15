'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FloatingBottomNav() {
  const pathname = usePathname()

  const items = [
    { icon: '🏠', label: 'Home',    href: '/' },
    { icon: '🗺',  label: 'Map',     href: '/browse/map' },
    { icon: '❤️', label: 'Saved',   href: '/saved' },
    { icon: '💬', label: 'Chat',    href: '/dashboard/messages' },
    { icon: '👤', label: 'Profile', href: '/dashboard' },
  ]

  // Hide on auth pages and full-screen editing views
  const hideOn = ['/login', '/signup', '/dashboard/add', '/dashboard/edit']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  return (
    <div style={{
      position:             'fixed',
      bottom:               '16px',
      left:                 '50%',
      transform:            'translateX(-50%)',
      zIndex:               100,
      background:           'rgba(255,255,255,0.96)',
      border:               '1px solid rgba(0,0,0,0.08)',
      borderRadius:         '30px',
      padding:              '10px 20px 12px',
      display:              'flex',
      gap:                  '28px',
      alignItems:           'center',
      backdropFilter:       'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow:            '0 4px 24px rgba(0,0,0,0.1)',
      width:                'max-content',
    }}>
      {items.map(item => {
        const isActive = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href)
        return (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           '3px',
              fontSize:      '9px',
              fontWeight:    600,
              color:         isActive ? '#1a6b4a' : '#c0bdb8',
              fontFamily:    'inherit',
              minWidth:      '40px',
            }}>
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{item.icon}</span>
              {item.label}
              {isActive && (
                <div style={{ width: '4px', height: '4px', background: '#1a6b4a', borderRadius: '50%' }} />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
