'use client'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ListerBottomNav from './ListerBottomNav'
import FloatingBottomNav from './FloatingBottomNav'

export default function SmartBottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const hideOn = ['/login', '/signup', '/onboarding']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  const isLister = session?.user?.userType === 'ADMIN'
  if (isLister) return <ListerBottomNav />
  return <FloatingBottomNav />
}
