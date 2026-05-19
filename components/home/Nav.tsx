import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UserMenu from './UserMenu'
import NavMobileMenu from './NavMobileMenu'

const GUEST_LINKS = [
  { label: 'Browse',       href: '/browse' },
  { label: 'Map',          href: '/browse/map' },
  { label: 'Estates',      href: '/browse?view=estates' },
  { label: 'Landlords',    href: '/signup' },
  { label: 'How it works', href: '/#how-it-works' },
]

const AUTH_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'Map',    href: '/browse/map' },
]

export default async function Nav() {
  const session  = await getServerSession(authOptions)
  const isAdmin  = session?.user?.userType === 'ADMIN'
  const dashHref = isAdmin ? '/dashboard' : '/dashboard/seeker'
  const links    = session ? AUTH_LINKS : GUEST_LINKS

  return (
    <nav style={{
      position:              'sticky',
      top:                   0,
      zIndex:                50,
      background:            'rgba(250,248,245,0.95)',
      backdropFilter:        'blur(12px)',
      WebkitBackdropFilter:  'blur(12px)',
      borderBottom:          '1px solid rgba(0,0,0,0.06)',
      padding:               '14px 16px',
      display:               'flex',
      alignItems:            'center',
      justifyContent:        'space-between',
    }}>

      {/* Logo */}
      <Link href="/" style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px', textDecoration: 'none' }}>
        <span style={{ color: '#0f0e0c' }}>Pata</span>
        <span style={{ color: '#1a6b4a' }}>Krib</span>
      </Link>

      {/* Center links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-11">
        {links.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            style={{ fontSize: '13px', color: '#6b6055', textDecoration: 'none' }}
          >
            {label}
          </Link>
        ))}
        {session && (
          <Link
            href={dashHref}
            style={{ fontSize: '13px', color: '#6b6055', textDecoration: 'none' }}
          >
            Dashboard
          </Link>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {session ? (
          <>
            {isAdmin && (
              <Link
                href="/dashboard/add"
                className="hidden md:inline-flex"
                style={{
                  background:     '#1a6b4a',
                  color:          '#fff',
                  padding:        '8px 18px',
                  borderRadius:   '20px',
                  fontSize:       '13px',
                  fontWeight:     700,
                  textDecoration: 'none',
                  border:         'none',
                }}
              >
                List Property
              </Link>
            )}
            <UserMenu
              name={session.user.name ?? null}
              userType={session.user.userType}
            />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="hidden md:inline"
              style={{ fontSize: '13px', color: '#6b6055', textDecoration: 'none' }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="hidden md:inline-flex"
              style={{
                background:     '#1a6b4a',
                color:          '#fff',
                padding:        '8px 18px',
                borderRadius:   '20px',
                fontSize:       '13px',
                fontWeight:     700,
                textDecoration: 'none',
                border:         'none',
              }}
            >
              List Property
            </Link>
          </>
        )}
        {/* Mobile hamburger */}
        <NavMobileMenu links={links} dashHref={dashHref} hasSession={!!session} isAdmin={isAdmin} />
      </div>

    </nav>
  )
}
