'use client'

import { useState, useEffect } from 'react'
import { useGeoLocation } from '@/lib/hooks/useGeoLocation'
import LocationPreviewMap from './LocationPreviewMap'
import PhotoUpload from './PhotoUpload'
import ListingPreview from './ListingPreview'

// ── Design-system constants ──────────────────────────────────────────────────

const INPUT = [
  'w-full border border-border bg-surface px-3 py-2.5',
  'font-sans text-[13px] text-ink',
  'focus:outline-none focus:border-border2 placeholder:text-muted',
  'transition-colors',
].join(' ')

const LABEL   = 'block font-sans text-[11px] uppercase tracking-[0.8px] text-muted mb-1.5'
const FIELD   = 'mb-5'
const GRID2   = 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5'
const SECTION = 'mb-10 pb-10 border-b border-border last:border-0 last:mb-0 last:pb-0'

// ── Property types ───────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: 'bedsitter',  label: 'Bedsitter'  },
  { value: 'studio',     label: 'Studio'     },
  { value: '1br',        label: '1 Bedroom'  },
  { value: '2br',        label: '2 Bedrooms' },
  { value: '3br',        label: '3 Bedrooms' },
  { value: '4br',        label: '4 Bedrooms' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'bungalow',   label: 'Bungalow'   },
  { value: 'mansion',    label: 'Mansion'    },
]

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-6 h-6 bg-accent flex items-center justify-center font-sans font-bold text-[11px] text-white flex-shrink-0">
        {num}
      </span>
      <h2 className="font-sans font-bold text-[13px] text-ink uppercase tracking-[1px]">
        {title}
      </h2>
    </div>
  )
}

function TagInput({
  tags, onAdd, onRemove, placeholder,
}: {
  tags:        string[]
  onAdd:       (tag: string) => void
  onRemove:    (tag: string) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !tags.includes(t)) { onAdd(t); setInput('') }
  }
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className={INPUT}
        />
        <button
          type="button"
          onClick={add}
          className="border border-border px-4 font-sans text-[18px] text-muted hover:border-border2 hover:text-ink transition-colors"
        >
          +
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 bg-surface border border-border font-sans text-[11px] text-ink px-2.5 py-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="text-muted hover:text-red transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function AddPropertyForm() {
  // Section 1 — Basic info
  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [price,        setPrice]        = useState('')
  const [priceType,    setPriceType]    = useState<'month' | 'year' | 'day'>('month')
  const [bedrooms,     setBedrooms]     = useState(1)
  const [bathrooms,    setBathrooms]    = useState(1)
  const [propertyType, setPropertyType] = useState('')

  // Section 2 — Location
  const [address,           setAddress]           = useState('')
  const [estate,            setEstate]            = useState('')
  const [city,              setCity]              = useState('Nairobi')
  const [lat,               setLat]               = useState<number | null>(null)
  const [lng,               setLng]               = useState<number | null>(null)
  const [locationConfirmed,  setLocationConfirmed]  = useState(false)
  const [showManualEntry,    setShowManualEntry]    = useState(false)
  const [manualLat,          setManualLat]          = useState('')
  const [manualLng,          setManualLng]          = useState('')
  const [accuracy,           setAccuracy]           = useState<number | null>(null)
  const [inlineManualLat,    setInlineManualLat]    = useState<number | null>(null)
  const [inlineManualLng,    setInlineManualLng]    = useState<number | null>(null)
  const gps = useGeoLocation()

  // Sync GPS capture into form state; require fresh confirmation on each capture
  useEffect(() => {
    if (gps.coords) {
      setLat(gps.coords.lat)
      setLng(gps.coords.lng)
      setAccuracy(gps.coords.accuracy)
      setLocationConfirmed(false)
    }
  }, [gps.coords])

  // Section 3 — Photos
  const [images, setImages] = useState<string[]>([])

  // Section 4 — Kenya details
  const [waterSchedule, setWaterSchedule] = useState('')
  const [matatuRoutes,  setMatatuRoutes]  = useState<string[]>([])
  const [safetyScore,   setSafetyScore]   = useState('')
  const [powerBackup,   setPowerBackup]   = useState(false)
  const [borehole,      setBorehole]      = useState(false)

  // Section 5 — Features & amenities
  const [features,  setFeatures]  = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [videoUrl,  setVideoUrl]  = useState('')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const doSubmit = async () => {
    if (title.length < 5)            { setError('Title must be at least 5 characters'); return }
    if (description.length < 20)     { setError('Description must be at least 20 characters'); return }
    if (!price || Number(price) <= 0) { setError('Price must be a positive number'); return }
    if (!propertyType)                { setError('Property type is required'); return }
    if (address.length < 5)          { setError('Address must be at least 5 characters'); return }
    if (lat === null || lng === null) {
      setError('GPS location is required — capture or enter coordinates in Section 2')
      return
    }
    if (!locationConfirmed) {
      setError('Please confirm the pin location in Section 2 before publishing')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/properties', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price:         Number(price),
          priceType,
          bedrooms,
          bathrooms,
          propertyType,
          address,
          estate:        estate        || undefined,
          city,
          latitude:      lat,
          longitude:     lng,
          images,
          videoUrl:      videoUrl      || undefined,
          features,
          amenities,
          waterSchedule: waterSchedule || undefined,
          matatuRoutes,
          safetyScore:   safetyScore ? Number(safetyScore) : undefined,
          powerBackup,
          borehole,
          status: 'available',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const fieldErrors = data.error
        if (typeof fieldErrors === 'object') {
          const first = Object.values(fieldErrors as Record<string, string[]>)[0]
          setError(Array.isArray(first) ? first[0] : 'Validation failed — check your inputs')
        } else {
          setError((data.error as string) ?? 'Failed to create property')
        }
        return
      }

      window.location.href = `/property/${(data.property as { id: string }).id}`
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); void doSubmit() }

  const gpsState = lat !== null ? 'captured'
    : gps.loading      ? 'loading'
    : gps.error !== null ? 'error'
    : 'idle'

  return (
    <div>
      {/* Page header */}
      <div className="px-4 py-5 md:px-16 md:py-8 border-b border-border">
        <p className="font-sans text-[11px] uppercase tracking-[1.2px] text-muted mb-1">
          Landlord dashboard
        </p>
        <h1 className="font-serif text-[32px] md:text-[36px] text-ink">List a new property</h1>
      </div>

      {/* Two-column layout */}
      <form onSubmit={handleSubmit}>
        <div className="px-4 py-6 md:px-16 md:py-10 flex flex-col md:flex-row gap-8 md:gap-12 items-start pb-28 md:pb-10">

          {/* Left — form sections */}
          <div className="flex-1 min-w-0">

            {/* ── Section 1: Basic info ─────────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={1} title="Basic information" />

              <div className={FIELD}>
                <label className={LABEL}>Property title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Modern 2BR apartment in Westlands"
                  className={INPUT}
                />
              </div>

              <div className={FIELD}>
                <label className={LABEL}>Property type</label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className={INPUT}
                >
                  <option value="">Select type…</option>
                  {PROPERTY_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className={GRID2}>
                <div>
                  <label className={LABEL}>Bedrooms</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={bedrooms}
                    onChange={e => setBedrooms(Number(e.target.value))}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Bathrooms</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={bathrooms}
                    onChange={e => setBathrooms(Number(e.target.value))}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className={GRID2}>
                <div>
                  <label className={LABEL}>Rent (KSh)</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 35000"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Per</label>
                  <select
                    value={priceType}
                    onChange={e => setPriceType(e.target.value as typeof priceType)}
                    className={INPUT}
                  >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                    <option value="day">Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the property — location highlights, finishes, who it's ideal for…"
                  className={INPUT}
                />
                <p className="font-sans text-[10px] text-muted mt-1">
                  {description.length} characters
                  {description.length < 20 ? ` · ${20 - description.length} more needed` : ' ✓'}
                </p>
              </div>
            </section>

            {/* ── Section 2: Location & GPS ─────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={2} title="Location & GPS" />

              {/* GPS capture card — 4 states */}
              {gpsState === 'idle' && (
                <div className="bg-ink p-5 relative overflow-hidden mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-[9px] font-bold tracking-[2px] uppercase text-white/40">
                      GPS Location
                    </span>
                    <span className="font-sans text-[9px] text-white/30">Stand at the property entrance</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLocationConfirmed(false); gps.capture() }}
                    className="w-full bg-accent text-white font-sans font-bold text-sm uppercase tracking-wider py-4 hover:bg-accent-d transition-all flex items-center justify-center gap-3"
                  >
                    <span className="text-lg">📍</span>
                    Capture My Location
                  </button>
                  <p className="text-center font-sans text-[10px] text-white/30 mt-3 leading-relaxed">
                    Stand at the property entrance and tap Capture. This pins the exact location on the map.
                  </p>
                </div>
              )}

              {gpsState === 'loading' && (
                <div className="bg-ink p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-[9px] font-bold tracking-[2px] uppercase text-white/40">
                      GPS Location
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="font-sans text-[9px] text-accent">Getting location...</span>
                    </div>
                  </div>
                  <div className="w-full py-4 flex items-center justify-center gap-3 text-white/50">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="font-sans text-sm">Acquiring GPS signal...</span>
                  </div>
                  <p className="text-center font-sans text-[10px] text-white/30 mt-2">
                    This may take up to 15 seconds outdoors
                  </p>
                </div>
              )}

              {gpsState === 'captured' && lat !== null && lng !== null && accuracy !== null && (
                <div className="bg-ink p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-[9px] font-bold tracking-[2px] uppercase text-white/40">
                      GPS Location
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-sans text-[9px] font-bold text-green-400 uppercase tracking-wider">
                        Live · Captured
                      </span>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-[7px] font-bold tracking-wider text-white/30 border border-white/10 px-1.5 py-0.5 uppercase">
                        LAT
                      </span>
                      <span className="font-serif text-xl font-black text-white tracking-tight">
                        {Math.abs(lat).toFixed(4)}°
                      </span>
                      <span className="font-sans text-[10px] font-bold text-gold">
                        {lat < 0 ? 'S' : 'N'}
                      </span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-[7px] font-bold tracking-wider text-white/30 border border-white/10 px-1.5 py-0.5 uppercase">
                        LNG
                      </span>
                      <span className="font-serif text-xl font-black text-white tracking-tight">
                        {Math.abs(lng).toFixed(4)}°
                      </span>
                      <span className="font-sans text-[10px] font-bold text-gold">
                        {lng > 0 ? 'E' : 'W'}
                      </span>
                    </div>
                  </div>

                  {/* Accuracy bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, 100 - (accuracy / 100) * 90))}%` }}
                        />
                      </div>
                      <span className="font-sans text-[10px] text-white/30 ml-3 whitespace-nowrap">
                        ±{accuracy}m accuracy
                      </span>
                    </div>
                    {accuracy > 50 ? (
                      <p className="font-sans text-[10px] text-gold/80">⚠ Move outdoors for better accuracy</p>
                    ) : (
                      <p className="font-sans text-[10px] text-green-400/80">✓ Good accuracy</p>
                    )}
                  </div>

                  {/* Recapture */}
                  <button
                    type="button"
                    onClick={() => { setLocationConfirmed(false); gps.capture() }}
                    className="w-full border border-white/10 text-white/50 font-sans text-[10px] font-bold uppercase tracking-wider py-2.5 hover:border-white/20 hover:text-white/70 transition-all"
                  >
                    🔄 Recapture location
                  </button>
                </div>
              )}

              {gpsState === 'error' && (
                <div className="bg-ink p-5 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-sans text-[9px] font-bold tracking-[2px] uppercase text-white/40">
                      GPS Location
                    </span>
                    <span className="font-sans text-[9px] text-red-400">Failed</span>
                  </div>

                  <div className="bg-red-400/10 border border-red-400/20 p-3 mb-4">
                    <p className="font-sans text-[11px] text-red-300 leading-relaxed">{gps.error}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setLocationConfirmed(false); gps.capture() }}
                    className="w-full bg-white/10 text-white font-sans text-sm font-bold uppercase tracking-wider py-3 hover:bg-white/15 transition-all mb-4"
                  >
                    Try again
                  </button>

                  <details>
                    <summary className="font-sans text-[10px] text-white/30 cursor-pointer hover:text-white/50">
                      Enter coordinates manually
                    </summary>
                    <div className="mt-3 space-y-2">
                      <input
                        type="number"
                        placeholder="Latitude e.g. -1.2847"
                        step="0.0001"
                        onChange={e => setInlineManualLat(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2 outline-none placeholder-white/20"
                      />
                      <input
                        type="number"
                        placeholder="Longitude e.g. 36.8200"
                        step="0.0001"
                        onChange={e => setInlineManualLng(e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-full bg-white/5 border border-white/10 text-white font-sans text-sm px-3 py-2 outline-none placeholder-white/20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inlineManualLat && inlineManualLng) {
                            setLat(inlineManualLat)
                            setLng(inlineManualLng)
                            setAccuracy(999)
                            setLocationConfirmed(false)
                            gps.clear()
                          }
                        }}
                        className="w-full bg-accent/20 text-accent font-sans text-xs font-bold uppercase tracking-wider py-2"
                      >
                        Use these coordinates
                      </button>
                      <p className="font-sans text-[9px] text-white/20 leading-relaxed">
                        Find your coordinates in Google Maps — long press on the location and copy the numbers shown
                      </p>
                    </div>
                  </details>
                </div>
              )}

              {/* Manual coordinate entry */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setShowManualEntry(p => !p)}
                  className="font-sans text-[11px] text-muted hover:text-ink transition-colors"
                >
                  {showManualEntry
                    ? '▲ Hide manual entry'
                    : '▾ Enter coordinates manually (desktop / escape hatch)'}
                </button>

                {showManualEntry && (
                  <div className="mt-3 bg-surface border border-border p-4">
                    <p className="font-sans text-[11px] text-muted mb-3">
                      Right-click on Google Maps → &ldquo;What&apos;s here?&rdquo; to copy coordinates.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className={LABEL}>Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={manualLat}
                          onChange={e => setManualLat(e.target.value)}
                          placeholder="-1.286389"
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={manualLng}
                          onChange={e => setManualLng(e.target.value)}
                          placeholder="36.817223"
                          className={INPUT}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const la = parseFloat(manualLat)
                        const lo = parseFloat(manualLng)
                        if (isNaN(la) || isNaN(lo)) return
                        setLat(la)
                        setLng(lo)
                        setLocationConfirmed(false)
                      }}
                      className="bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-[0.8px] px-4 py-2 hover:bg-accent-d transition-colors"
                    >
                      Use these coordinates
                    </button>
                  </div>
                )}
              </div>

              {/* Map preview + confirmation (shown whenever coordinates are set) */}
              {lat !== null && lng !== null && (
                <div className="mb-5">
                  <LocationPreviewMap lat={lat} lng={lng} />
                  {!locationConfirmed ? (
                    <div className="mt-3 bg-surface2 border border-border px-4 py-3">
                      <p className="font-sans font-bold text-[12px] text-ink mb-3">
                        Is this pin in the right location?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLocationConfirmed(true)}
                          className="flex-1 bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-[0.8px] py-2 hover:bg-accent-d transition-colors"
                        >
                          ✓ Yes, this is correct
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLat(null); setLng(null); setLocationConfirmed(false) }}
                          className="flex-1 bg-surface border border-border text-ink font-sans font-bold text-[11px] uppercase tracking-[0.8px] py-2 hover:bg-surface2 transition-colors"
                        >
                          ✗ No, clear and retry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between bg-surface border border-border px-4 py-2.5">
                      <span className="font-sans text-[12px] text-green font-bold">✓ Location confirmed</span>
                      <button
                        type="button"
                        onClick={() => setLocationConfirmed(false)}
                        className="font-sans text-[11px] text-muted hover:text-ink underline"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className={FIELD}>
                <label className={LABEL}>Street address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Kijabe Street, off Waiyaki Way"
                  className={INPUT}
                />
              </div>

              <div className={GRID2}>
                <div>
                  <label className={LABEL}>Estate / neighbourhood</label>
                  <input
                    type="text"
                    value={estate}
                    onChange={e => setEstate(e.target.value)}
                    placeholder="e.g. Westlands"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
            </section>

            {/* ── Section 3: Photos ─────────────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={3} title="Photos" />
              <PhotoUpload
                urls={images}
                onAdd={url => setImages(prev => [...prev, url])}
                onRemove={url => setImages(prev => prev.filter(u => u !== url))}
              />
            </section>

            {/* ── Section 4: Kenya details ──────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={4} title="Kenya details" />

              <div className={FIELD}>
                <label className={LABEL}>Water schedule</label>
                <input
                  type="text"
                  value={waterSchedule}
                  onChange={e => setWaterSchedule(e.target.value)}
                  placeholder="e.g. 24/7, Mon–Fri 6am–6pm, Tankered"
                  className={INPUT}
                />
              </div>

              <div className={FIELD}>
                <label className={LABEL}>Safety score (0 – 10)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={safetyScore}
                  onChange={e => setSafetyScore(e.target.value)}
                  placeholder="e.g. 8.5"
                  className={INPUT}
                />
              </div>

              <div className={FIELD}>
                <label className={LABEL}>Matatu routes</label>
                <TagInput
                  tags={matatuRoutes}
                  onAdd={t => setMatatuRoutes(prev => [...prev, t])}
                  onRemove={t => setMatatuRoutes(prev => prev.filter(r => r !== t))}
                  placeholder="e.g. Route 23, Route 111 — press Enter to add"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={powerBackup}
                    onChange={e => setPowerBackup(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="font-sans text-[13px] text-ink">Power backup (generator / solar)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={borehole}
                    onChange={e => setBorehole(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="font-sans text-[13px] text-ink">Borehole</span>
                </label>
              </div>
            </section>

            {/* ── Section 5: Features & amenities ──────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={5} title="Features & amenities" />

              <div className={FIELD}>
                <label className={LABEL}>Features</label>
                <TagInput
                  tags={features}
                  onAdd={t => setFeatures(prev => [...prev, t])}
                  onRemove={t => setFeatures(prev => prev.filter(f => f !== t))}
                  placeholder="e.g. Parking, Security, WiFi — press Enter to add"
                />
              </div>

              <div className={FIELD}>
                <label className={LABEL}>Amenities</label>
                <TagInput
                  tags={amenities}
                  onAdd={t => setAmenities(prev => [...prev, t])}
                  onRemove={t => setAmenities(prev => prev.filter(a => a !== t))}
                  placeholder="e.g. Gym, Rooftop, Swimming pool — press Enter to add"
                />
              </div>

              <div>
                <label className={LABEL}>Video tour URL (optional)</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className={INPUT}
                />
              </div>
            </section>

            {/* ── Section 6: Submit ──────────────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={6} title="Publish listing" />

              {error && (
                <div className="bg-red/10 border border-red/20 px-4 py-3 mb-5">
                  <p className="font-sans text-[12px] text-red">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent text-white font-sans font-bold text-[13px] uppercase tracking-[0.8px] py-4 hover:bg-accent-d transition-colors disabled:opacity-60"
              >
                {submitting ? 'Publishing…' : 'Publish listing'}
              </button>

              <p className="font-sans text-[11px] text-muted text-center mt-3">
                Your listing will be live immediately after publishing.
              </p>
            </section>

          </div>

          {/* Right — sticky live preview (desktop only) */}
          <div className="hidden md:block w-[320px] flex-shrink-0 sticky top-24 py-2">
            <ListingPreview
              title={title}
              price={price}
              priceType={priceType}
              propertyType={propertyType}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              address={address}
              estate={estate}
              description={description}
              images={images}
              lat={lat}
              lng={lng}
            />
          </div>

        </div>
      </form>

      {/* Mobile sticky submit bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-border px-4 py-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void doSubmit()}
          className="w-full bg-accent text-white font-sans font-bold text-[13px] uppercase tracking-[0.8px] py-4 hover:bg-accent-d transition-colors disabled:opacity-60"
        >
          {submitting ? 'Publishing…' : 'Publish listing'}
        </button>
      </div>
    </div>
  )
}
