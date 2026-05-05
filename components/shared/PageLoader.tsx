'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageLoader() {
  const pathname        = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 500)
    return () => clearTimeout(t)
  }, [pathname])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden">
      <div className="h-full bg-accent animate-progress-bar" />
    </div>
  )
}
