'use client'

import { useState } from 'react'
import HeroSlider from './HeroSlider'
import MapSection from './MapSection'
import StatsBar from './StatsBar'
import NavigationModal from '@/components/shared/NavigationModal'
import type { SerializedProperty } from '@/types/property'

interface StatsData {
  totalListings:  number
  totalLandlords: number
  estatesCovered: number
  gpsVerified:    number
}

export default function HomeContent({
  properties,
  stats,
  dbError,
}: {
  properties: SerializedProperty[]
  stats?: StatsData
  dbError?: boolean
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
      <HeroSlider properties={properties} dbError={dbError} />
      <MapSection
        properties={properties}
        selectedId={selectedId}
        onSelectProperty={setSelectedId}
        onNavigate={handleNavigate}
      />
      <StatsBar stats={stats} />

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
