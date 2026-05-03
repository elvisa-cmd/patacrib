'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/shared/SignOutButton'

interface UserMenuProps {
  name:       string | null
  userType:   string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

export default function UserMenu({ name, userType }: UserMenuProps) {
  const [open, setOpen]  = useState(false)
  const ref              = useRef<HTMLDivElement>(null)
  const dashHref         = userType === 'ADMIN' ? '/dashboard/admin' : '/dashboard/seeker'

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="User menu"
        className="w-8 h-8 bg-accent flex items-center justify-center hover:bg-accent-d transition-colors"
      >
        <span className="font-sans font-bold text-[11px] text-white">
          {getInitials(name)}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-[180px] bg-surface border border-border shadow-sm z-50">
          {/* User name */}
          <div className="px-4 py-3 border-b border-border">
            <p className="font-sans font-bold text-[12px] text-ink truncate">{name ?? 'Account'}</p>
            <p className="font-sans text-[10px] text-muted capitalize">{userType.toLowerCase()}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href={dashHref}
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-2.5 font-sans text-[12px] text-ink hover:bg-surface2 transition-colors"
            >
              Dashboard
            </Link>
            {userType === 'ADMIN' && (
              <Link
                href="/dashboard/add"
                onClick={() => setOpen(false)}
                className="flex items-center px-4 py-2.5 font-sans text-[12px] text-ink hover:bg-surface2 transition-colors"
              >
                List a property
              </Link>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <SignOutButton className="w-full text-left px-4 py-2.5 font-sans text-[12px] text-red hover:bg-surface2 transition-colors" />
          </div>
        </div>
      )}
    </div>
  )
}
