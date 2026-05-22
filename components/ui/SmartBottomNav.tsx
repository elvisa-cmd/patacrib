'use client'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ListerBottomNav from './ListerBottomNav'
import FloatingBottomNav from './FloatingBottomNav'

export default function SmartBottomNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Never show on auth or full-screen edit pages
  const hideOn = ['/login', '/signup', '/onboarding', '/dashboard/add', '/dashboard/edit']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  const isLister = session?.user?.userType === 'ADMIN'

  // Seeker dashboard — always show seeker nav
  if (pathname === '/dashboard/seeker') return <FloatingBottomNav />

  // All other /dashboard routes — lister has their own nav embedded in the page
  if (pathname.startsWith('/dashboard') && isLister) return <ListerBottomNav />
  if (pathname.startsWith('/dashboard') && !isLister) return null

  if (isLister) return <ListerBottomNav />
  return <FloatingBottomNav />
}
