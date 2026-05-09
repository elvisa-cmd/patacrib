'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NavLink { label: string; href: string }

interface Props {
  links:      NavLink[]
  dashHref:   string
  hasSession: boolean
  isAdmin:    boolean
}

export default function NavMobileMenu({ links, dashHref, hasSession, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      {/* Hamburger / close button — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="md:hidden flex items-center justify-center w-9 h-9 flex-shrink-0 text-ink"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Slide-down drawer — fixed so it always clears the nav */}
      {open && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-bg border-b border-border z-[499] flex flex-col py-2 shadow-sm">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={close}
              className="font-sans text-[14px] text-muted px-5 py-3.5 border-b border-border last:border-0 hover:text-ink hover:bg-surface2 transition-colors"
            >
              {label}
            </Link>
          ))}
          {hasSession && (
            <Link href={dashHref} onClick={close} className="font-sans text-[14px] text-muted px-5 py-3.5 border-b border-border hover:text-ink hover:bg-surface2 transition-colors">
              Dashboard
            </Link>
          )}
          {!hasSession && (
            <Link href="/login" onClick={close} className="font-sans text-[14px] text-muted px-5 py-3.5 border-b border-border hover:text-ink hover:bg-surface2 transition-colors">
              Sign in
            </Link>
          )}
          {isAdmin && (
            <div className="px-4 py-3">
              <Link
                href="/dashboard/add"
                onClick={close}
                className="block w-full text-center font-sans font-bold text-[12px] uppercase tracking-[0.5px] bg-ink text-white px-4 py-3 hover:bg-accent-d transition-colors"
              >
                List property
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
