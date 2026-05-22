'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ListerBottomNav() {
  const pathname = usePathname()

  const items = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🏠', label: 'List',      href: '/dashboard/add' },
    { icon: '🗺',  label: 'Browse',   href: '/browse' },
    { icon: '👤', label: 'Profile',   href: '/dashboard/profile' },
  ]

  const hideOn = ['/dashboard/add', '/dashboard/edit']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  return (
    <div style={{
      position:   'fixed',
      bottom:     '16px',
      left:       '50%',
      transform:  'translateX(-50%)',
      zIndex:     100,
      background: '#0d0d0d',
      borderRadius: '30px',
      padding:    '10px 20px 12px',
      display:    'flex',
      gap:        '24px',
      alignItems: 'center',
      boxShadow:  '0 4px 24px rgba(0,0,0,0.25)',
      width:      'max-content',
    }}>
      {items.map(item => {
        const isActive = item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href)
        return (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           '3px',
              fontSize:      '9px',
              fontWeight:    700,
              color:         isActive ? '#fff' : 'rgba(255,255,255,0.25)',
              fontFamily:    'inherit',
              minWidth:      '44px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
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
