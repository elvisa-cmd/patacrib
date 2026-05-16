'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import HeroSlider from './HeroSlider'
import MapSection from './MapSection'

const HomeMiniMap = dynamic(() => import('./HomeMiniMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      margin:         '0 12px 16px',
      height:         '230px',
      background:     '#f0f0eb',
      borderRadius:   '18px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width:        '24px',
        height:       '24px',
        border:       '2px solid #1a6b4a',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation:    'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  ),
})
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
      <HomeMiniMap
        properties={properties}
        avgPrice={properties.reduce((s, p) => s + (p.price || 0), 0) / (properties.length || 1)}
        tourCount={properties.filter(p => p.videoUrl || p.tourImageUrl).length}
      />
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
