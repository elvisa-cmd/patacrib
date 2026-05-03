import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UserMenu from './UserMenu'

const GUEST_LINKS = [
  { label: 'Browse',       href: '/browse' },
  { label: 'Map',          href: '/browse?view=map' },
  { label: 'Estates',      href: '/browse?view=estates' },
  { label: 'Landlords',    href: '/dashboard' },
  { label: 'How it works', href: '/#how-it-works' },
]

const AUTH_LINKS = [
  { label: 'Browse', href: '/browse' },
  { label: 'Map',    href: '/browse?view=map' },
]

export default async function Nav() {
  const session  = await getServerSession(authOptions)
  const isAdmin  = session?.user?.userType === 'ADMIN'
  const dashHref = isAdmin ? '/dashboard/admin' : '/dashboard/seeker'
  const links    = session ? AUTH_LINKS : GUEST_LINKS

  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] h-[60px] border-b border-border flex items-center justify-between px-16 bg-bg/[0.92] backdrop-blur-md">

      {/* Logo */}
      <Link href="/" className="font-sans font-black text-[18px] tracking-tight flex-shrink-0">
        <span className="text-ink">Pata</span>
        <span className="text-accent">Crib</span>
      </Link>

      {/* Center links */}
      <div className="flex items-center gap-11">
        {links.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="font-sans font-normal text-[12px] uppercase tracking-[0.8px] text-muted hover:text-ink transition-colors"
          >
            {label}
          </Link>
        ))}
        {session && (
          <Link
            href={dashHref}
            className="font-sans font-normal text-[12px] uppercase tracking-[0.8px] text-muted hover:text-ink transition-colors"
          >
            Dashboard
          </Link>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {session ? (
          <>
            {isAdmin && (
              <Link
                href="/dashboard/add"
                className="font-sans font-bold text-[12px] uppercase tracking-[0.5px] bg-ink text-white px-4 py-2 hover:bg-accent-d transition-colors"
              >
                List property
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
              className="font-sans font-normal text-[13px] text-muted hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <div className="w-px h-5 bg-border" />
            <Link
              href="/login"
              className="font-sans font-bold text-[12px] uppercase tracking-[0.5px] bg-ink text-white px-4 py-2 hover:bg-accent-d transition-colors"
            >
              List property
            </Link>
          </>
        )}
      </div>

    </nav>
  )
}
