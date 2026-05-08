'use client'

import { useState } from 'react'
import FeaturedStrip from './FeaturedStrip'
import MapSection from './MapSection'
import NavigationModal from '@/components/shared/NavigationModal'
import type { SerializedProperty } from '@/types/property'

export default function HomeContent({
  properties,
}: {
  properties: SerializedProperty[]
}) {
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [navOpen,      setNavOpen]      = useState(false)
  const [navProperty,  setNavProperty]  = useState<SerializedProperty | null>(null)

  function handleNavigate(property: SerializedProperty) {
    setNavProperty(property)
    setNavOpen(true)
  }

  return (
    <>
      <FeaturedStrip properties={properties} />
      <MapSection
        properties={properties}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
        onNavigate={handleNavigate}
      />

      {/* In-app navigation modal — opened from map route card */}
      <NavigationModal
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        property={
          navProperty
            ? {
                title:        navProperty.title,
                address:      navProperty.address,
                latitude:     navProperty.latitude,
                longitude:    navProperty.longitude,
                price:        navProperty.price,
                estate:       navProperty.estate,
                matatuRoutes: navProperty.matatuRoutes,
              }
            : null
        }
      />
    </>
  )
}
