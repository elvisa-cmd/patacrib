'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { formatPrice } from '@/lib/price'
import NavigationModal from '@/components/shared/NavigationModal'

const MiniMap = dynamic(() => import('./PropertyMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="bg-surface2 flex items-center justify-center"
      style={{ height: '160px' }}
    >
      <p className="font-sans text-[11px] text-muted">Loading…</p>
    </div>
  ),
})

interface PriceCardProps {
  price:         number
  priceType:     string
  propertyId:    string
  adminId:       string
  adminName:     string
  isSaved:       boolean
  isLoggedIn:    boolean
  lat:           number
  lng:           number
  address:       string
  title:         string
  totalListings: number
  estate:        string | null
  matatuRoutes:  string[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PriceCard({
  price,
  priceType,
  propertyId,
  adminId,
  adminName,
  isSaved:       initialSaved,
  isLoggedIn,
  lat,
  lng,
  address,
  title,
  totalListings,
  estate,
  matatuRoutes,
}: PriceCardProps) {
  const [saved,   setSaved]   = useState(initialSaved)
  const [saving,  setSaving]  = useState(false)
  const [copied,  setCopied]  = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const handleSave = async () => {
    if (!isLoggedIn) { window.location.href = '/login'; return }
    setSaving(true)
    try {
      const res  = await fetch('/api/saved', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ propertyId }),
      })
      const data = await res.json()
      if (res.ok) setSaved(data.saved as boolean)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async () => {
    const url  = window.location.href
    const text = `Check out this property on PataKrib: ${title} — ${formatPrice(price)}/mo`
    if (navigator.share) {
      try { await navigator.share({ title, text, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const priceLabel =
    priceType === 'month' ? '/month' :
    priceType === 'year'  ? '/year'  : '/day'

  const messageHref = isLoggedIn
    ? `/dashboard/messages?property=${propertyId}&landlord=${adminId}`
    : '/login'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Price box ──────────────────────────────────────────── */}
      <div className="bg-surface border border-border">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-[32px] text-ink leading-none">
              {formatPrice(price)}
            </span>
            <span className="font-sans text-[13px] text-muted">{priceLabel}</span>
          </div>
          <p className="font-sans text-[11px] text-muted">
            2 months deposit · {formatPrice(price * 2)}
          </p>
        </div>

        <div className="px-5 py-4">
          <a
            href={messageHref}
            aria-label="Book a viewing for this property"
            className="block w-full text-center bg-accent text-white font-sans font-bold text-[13px] uppercase tracking-[0.8px] py-3 mb-3 hover:bg-accent-d hover:-translate-y-px transition-all"
          >
            📅 Book a Viewing
          </a>

          {/* Get Directions — opens in-app NavigationModal */}
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Get in-app directions to this property"
            className="w-full border-2 border-accent text-accent font-sans font-bold text-[13px] uppercase tracking-[0.8px] py-3 mb-3 flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all"
          >
            🗺 Get Directions
          </button>

          <div className="grid grid-cols-3 gap-2">
            <a
              href={messageHref}
              aria-label="Message the landlord"
              className="text-center border border-border font-sans font-medium text-[11px] text-muted py-2 hover:border-border2 hover:text-ink transition-colors"
            >
              💬 Message
            </a>
            <button
              onClick={handleShare}
              aria-label="Share this property"
              className="text-center border border-border font-sans font-medium text-[11px] text-muted py-2 hover:border-border2 hover:text-ink transition-colors"
            >
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={saved ? 'Remove from saved' : 'Save this property'}
              className={`text-center border font-sans font-medium text-[11px] py-2 transition-colors ${
                saved
                  ? 'border-accent text-accent'
                  : 'border-border text-muted hover:border-border2 hover:text-ink'
              }`}
            >
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mini map ───────────────────────────────────────────── */}
      <div className="bg-surface border border-border overflow-hidden relative">
        <MiniMap lat={lat} lng={lng} title={title} height="160px" onNavigate={() => setNavOpen(true)} />
        <a
          href={`/browse?highlight=${propertyId}`}
          className="absolute bottom-2 right-2 z-[1000] bg-surface border border-border font-sans font-medium text-[10px] uppercase tracking-[0.5px] text-muted px-2 py-1 hover:text-ink transition-colors"
        >
          View full map →
        </a>
      </div>

      {/* ── GPS card ───────────────────────────────────────────── */}
      <div className="bg-ink px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-sans text-[9px] uppercase tracking-[1.5px] text-white/30">
            GPS Location
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            <span className="font-sans text-[9px] text-accent">Live · Verified</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="font-sans text-[8px] uppercase tracking-[1px] text-white/30 mb-0.5">LAT</p>
            <p className="font-sans font-bold text-[13px] text-white">
              {Math.abs(lat).toFixed(4)}°&nbsp;{lat < 0 ? 'S' : 'N'}
            </p>
          </div>
          <div className="w-px h-7 bg-white/10" />
          <div>
            <p className="font-sans text-[8px] uppercase tracking-[1px] text-white/30 mb-0.5">LNG</p>
            <p className="font-sans font-bold text-[13px] text-white">
              {Math.abs(lng).toFixed(4)}°&nbsp;{lng >= 0 ? 'E' : 'W'}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="h-0.5 bg-white/10 overflow-hidden mb-1">
            <div className="h-full bg-accent" style={{ width: '70%' }} />
          </div>
          <p className="font-sans text-[9px] text-white/30 text-right">±3m accuracy</p>
        </div>

        <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="font-sans font-semibold text-[12px] text-white/70 truncate">{address}</p>
          <p className="font-sans text-[10px] text-white/30 mt-0.5">Nairobi, Kenya</p>
        </div>
      </div>

      {/* ── Landlord card ──────────────────────────────────────── */}
      <div className="bg-surface border border-border">
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent flex items-center justify-center flex-shrink-0">
              <span className="font-sans font-bold text-[14px] text-white">
                {getInitials(adminName)}
              </span>
            </div>
            <div>
              <p className="font-sans font-bold text-[13px] text-ink">{adminName}</p>
              <p className="font-sans text-[10px] text-accent">✓ Verified landlord</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-border">
          {[
            { label: 'Response rate', value: '98%'              },
            { label: 'Response time', value: '< 1 hr'           },
            { label: 'Rating',        value: '4.9 ★'            },
            { label: 'Listings',      value: String(totalListings) },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={[
                'px-4 py-3',
                i % 2 === 0 ? 'border-r border-border' : '',
                i < 2       ? 'border-b border-border' : '',
              ].join(' ')}
            >
              <p className="font-sans font-bold text-[13px] text-ink">{stat.value}</p>
              <p className="font-sans text-[9px] uppercase tracking-[0.8px] text-muted2 mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 py-3">
          <a
            href={messageHref}
            aria-label="Send a message to the landlord"
            className="block w-full text-center border border-border font-sans font-medium text-[12px] text-muted py-2.5 hover:border-border2 hover:text-ink transition-colors"
          >
            💬 Send message
          </a>
        </div>
      </div>

      {/* ── In-app navigation modal ────────────────────────────── */}
      <NavigationModal
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        property={{
          title,
          address,
          latitude:     lat,
          longitude:    lng,
          price,
          estate,
          matatuRoutes,
        }}
      />
    </div>
  )
}
