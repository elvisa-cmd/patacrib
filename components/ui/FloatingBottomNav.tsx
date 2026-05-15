'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { emoji: '🏠', label: 'Home',    href: '/' },
  { emoji: '🗺',  label: 'Map',     href: '/browse/map' },
  { emoji: '♡',  label: 'Saved',   href: '/dashboard/seeker' },
  { emoji: '💬', label: 'Chat',    href: '/dashboard/messages' },
  { emoji: '👤', label: 'Profile', href: '/dashboard' },
]

export default function FloatingBottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position:              'fixed',
      bottom:                '16px',
      left:                  '50%',
      transform:             'translateX(-50%)',
      zIndex:                100,
      background:            'rgba(255,255,255,0.95)',
      border:                '1px solid rgba(0,0,0,0.08)',
      borderRadius:          '30px',
      padding:               '10px 20px 13px',
      display:               'flex',
      gap:                   '24px',
      alignItems:            'center',
      backdropFilter:        'blur(12px)',
      WebkitBackdropFilter:  'blur(12px)',
      boxShadow:             '0 4px 24px rgba(0,0,0,0.1)',
    }}>
      {ITEMS.map(item => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '3px',
              fontSize:       '9px',
              fontWeight:     600,
              color:          isActive ? '#1a6b4a' : '#c0bdb8',
              fontFamily:     'Sora, sans-serif',
              minWidth:       '36px',
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.emoji}</span>
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
