'use client'

import { openDirections } from '@/lib/utils'
import { formatPrice } from '@/lib/price'

interface Props {
  lat:        number
  lng:        number
  title:      string
  price:      number
  priceType:  string
  isLoggedIn: boolean
  adminId:    string
  propertyId: string
}

export default function MobilePropertyBar({
  lat, lng, title, price, priceType, isLoggedIn, adminId, propertyId,
}: Props) {
  const messageHref = isLoggedIn
    ? `/dashboard/messages?property=${propertyId}&landlord=${adminId}`
    : '/login'

  const priceLabel =
    priceType === 'month' ? '/mo' :
    priceType === 'year'  ? '/yr' : '/day'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border px-4 py-3 flex items-center gap-3">
      <div className="flex-shrink-0">
        <div className="font-serif text-[20px] text-ink leading-none">{formatPrice(price)}</div>
        <div className="font-sans text-[10px] text-muted">{priceLabel}</div>
      </div>

      <div className="flex gap-2 flex-1 justify-end">
        <button
          type="button"
          onClick={() => openDirections(lat, lng, title)}
          className="flex-1 border border-accent text-accent font-sans font-bold text-[11px] uppercase tracking-wide py-3 flex items-center justify-center gap-1.5 hover:bg-accent hover:text-white transition-all"
        >
          🗺 Directions
        </button>
        <a
          href={messageHref}
          className="flex-1 bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-wide py-3 flex items-center justify-center hover:bg-accent-d transition-colors"
        >
          Book Viewing
        </a>
      </div>
    </div>
  )
}
