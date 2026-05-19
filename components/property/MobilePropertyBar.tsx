'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/price'
import NavigationModal from '@/components/shared/NavigationModal'
import ViewingModal    from '@/components/property/ViewingModal'

interface Props {
  lat:            number
  lng:            number
  title:          string
  address:        string
  price:          number
  priceType:      string
  isLoggedIn:     boolean
  adminId:        string
  propertyId:     string
  estate:         string | null
  matatuRoutes:   string[]
  landlordPhone?: string | null
  landlordName?:  string | null
  city?:          string | null
}

export default function MobilePropertyBar({
  lat, lng, title, address, price, priceType, isLoggedIn, adminId, propertyId, estate, matatuRoutes,
  landlordPhone, city,
}: Props) {
  const [navOpen,     setNavOpen]     = useState(false)
  const [viewingOpen, setViewingOpen] = useState(false)

  const messageHref = isLoggedIn
    ? `/dashboard/messages?property=${propertyId}&landlord=${adminId}`
    : '/login'

  const priceLabel =
    priceType === 'month' ? '/mo' :
    priceType === 'year'  ? '/yr' : '/day'

  const propertyUrl  = `https://patacrib.vercel.app/property/${propertyId}`
  const location     = estate || city || 'Nairobi'
  const cleanPhone   = landlordPhone
    ? landlordPhone.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '')
    : null
  const waMessage    = encodeURIComponent(
    `Hi, I saw your property on PataKrib and I am interested.\n\n*${title}*\n📍 ${location}\n💰 KSh ${price?.toLocaleString('en-KE')}/month\n\nView listing: ${propertyUrl}\n\nCould we arrange a viewing?`
  )
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${waMessage}`
    : `https://wa.me/?text=${waMessage}`

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-shrink-0">
            <div className="font-serif text-[18px] text-ink leading-none">{formatPrice(price)}</div>
            <div className="font-sans text-[10px] text-muted">{priceLabel}</div>
          </div>
          <div className="flex gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="border border-accent text-accent font-sans font-bold text-[11px] uppercase tracking-wide px-4 py-2.5 flex items-center justify-center gap-1 hover:bg-accent hover:text-white transition-all"
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
              className="border border-accent text-accent font-sans font-bold text-[11px] uppercase tracking-wide px-4 py-2.5 flex items-center justify-center hover:bg-accent hover:text-white transition-all"
            >
              📅 Viewing
            </button>
          </div>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '8px',
            width:          '100%',
            padding:        '13px',
            background:     '#25D366',
            color:          '#fff',
            borderRadius:   '12px',
            fontSize:       '14px',
            fontWeight:     700,
            textDecoration: 'none',
            fontFamily:     'inherit',
            boxSizing:      'border-box',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Contact on WhatsApp
        </a>
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
