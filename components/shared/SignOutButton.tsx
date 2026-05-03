'use client'

import { signOut } from 'next-auth/react'

interface SignOutButtonProps {
  className?: string
}

export default function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className={className}
    >
      Sign out
    </button>
  )
}
