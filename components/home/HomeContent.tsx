'use client'

import { useState } from 'react'
import FeaturedStrip from './FeaturedStrip'
import MapSection from './MapSection'
import type { SerializedProperty } from '@/types/property'

export default function HomeContent({
  properties,
}: {
  properties: SerializedProperty[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <FeaturedStrip properties={properties} />
      <MapSection
        properties={properties}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
      />
    </>
  )
}
