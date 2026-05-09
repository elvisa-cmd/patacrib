'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/price'
import NavigationModal from '@/components/shared/NavigationModal'
import ViewingModal    from '@/components/property/ViewingModal'

interface Props {
  lat:          number
  lng:          number
  title:        string
  address:      string
  price:        number
  priceType:    string
  isLoggedIn:   boolean
  adminId:      string
  propertyId:   string
  estate:       string | null
  matatuRoutes: string[]
}

export default function MobilePropertyBar({
  lat, lng, title, address, price, priceType, isLoggedIn, adminId, propertyId, estate, matatuRoutes,
}: Props) {
  const [navOpen,     setNavOpen]     = useState(false)
  const [viewingOpen, setViewingOpen] = useState(false)

  const messageHref = isLoggedIn
    ? `/dashboard/messages?property=${propertyId}&landlord=${adminId}`
    : '/login'

  const priceLabel =
    priceType === 'month' ? '/mo' :
    priceType === 'year'  ? '/yr' : '/day'

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="font-serif text-[20px] text-ink leading-none">{formatPrice(price)}</div>
          <div className="font-sans text-[10px] text-muted">{priceLabel}</div>
        </div>

        <div className="flex gap-2 flex-1 justify-end">
          {/* Opens in-app NavigationModal instead of external maps */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="flex-1 border border-accent text-accent font-sans font-bold text-[11px] uppercase tracking-wide py-3 flex items-center justify-center gap-1.5 hover:bg-accent hover:text-white transition-all"
            aria-label="Get in-app directions"
          >
            🗺 Directions
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) { window.location.href = '/login'; return }
              setViewingOpen(true)
            }}
            className="flex-1 bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-wide py-3 flex items-center justify-center hover:bg-accent-d transition-colors"
          >
            Book Viewing
          </button>
        </div>
      </div>

      {/* Viewing request modal */}
      <ViewingModal
        isOpen={viewingOpen}
        onClose={() => setViewingOpen(false)}
        propertyId={propertyId}
        propertyTitle={title}
      />

      {/* In-app navigation modal */}
      <NavigationModal
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        property={{ title, address, latitude: lat, longitude: lng, price, estate, matatuRoutes }}
      />
    </>
  )
}
