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
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] flex-shrink-0"
      >
        <span className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
        <span className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-ink transition-all duration-200 ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
      </button>

      {/* Slide-down menu */}
      {open && (
        <div className="md:hidden absolute top-[60px] left-0 right-0 bg-bg border-b border-border z-[500] flex flex-col py-2">
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
            <Link href="/login" onClick={close} className="font-sans text-[14px] text-muted px-5 py-3.5 hover:text-ink hover:bg-surface2 transition-colors">
              Sign in
            </Link>
          )}
          {isAdmin && (
            <div className="px-4 py-3">
              <Link href="/dashboard/add" onClick={close} className="block w-full text-center font-sans font-bold text-[12px] uppercase tracking-[0.5px] bg-ink text-white px-4 py-3 hover:bg-accent-d transition-colors">
                List property
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
