'use client'

import dynamic from 'next/dynamic'
import type { SerializedProperty } from '@/types/property'

interface MapSectionProps {
  properties:       SerializedProperty[]
  selectedId:       string | null
  onSelectProperty: (id: string) => void
  onNavigate:       (property: SerializedProperty) => void
}

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-surface2">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
    </div>
  ),
})

export default function MapSection(props: MapSectionProps) {
  return (
    <section className="mx-4 md:mx-16 mb-0">
      <div className="relative border border-border2 aspect-[4/3] md:aspect-[16/6]">
        <LeafletMap {...props} />
      </div>
    </section>
  )
}
