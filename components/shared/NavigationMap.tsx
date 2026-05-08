'use client'

import dynamic from 'next/dynamic'
import type { NavigationMapInnerProps } from './NavigationMapInner'

const NavigationMapInner = dynamic(
  () => import('./NavigationMapInner'),
  {
    ssr:     false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-surface2">
        <p className="font-sans text-[12px] text-muted">Loading map…</p>
      </div>
    ),
  },
)

export default function NavigationMap(props: NavigationMapInnerProps) {
  return <NavigationMapInner {...props} />
}
