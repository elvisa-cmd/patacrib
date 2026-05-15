'use client'

import { useState } from 'react'
import PlusCodePicker from '@/components/shared/PlusCodePicker'
import TourRecorder from '@/components/shared/TourRecorder'
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
  const [address,         setAddress]         = useState('')
  const [estate,          setEstate]          = useState('')
  const [city,            setCity]            = useState('Nairobi')
  const [lat,              setLat]              = useState<number | null>(null)
  const [lng,              setLng]              = useState<number | null>(null)
  const [capturedAddress,  setCapturedAddress]  = useState('')
  const [capturedPlusCode, setCapturedPlusCode] = useState('')

  // Section 3 — Photos
  const [images, setImages] = useState<string[]>([])

  // Section 4 — Virtual tour
  const [videoUrl,         setVideoUrl]         = useState('')
  const [tourImageUrl,     setTourImageUrl]     = useState('')
  const [tourImgUploading, setTourImgUploading] = useState(false)
  const [tourImgError,     setTourImgError]     = useState('')

  // Section 5 — Kenya details
  const [waterSchedule, setWaterSchedule] = useState('')
  const [matatuRoutes,  setMatatuRoutes]  = useState<string[]>([])
  const [safetyScore,   setSafetyScore]   = useState('')
  const [powerBackup,   setPowerBackup]   = useState(false)
  const [borehole,      setBorehole]      = useState(false)

  // Section 6 — Features & amenities
  const [features,  setFeatures]  = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])

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
      setError('Please enter your Plus Code to set the property location.')
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
          plusCode:      capturedPlusCode || undefined,
          images,
          videoUrl:      videoUrl      || undefined,
          tourImageUrl:  tourImageUrl  || undefined,
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

              <div className="mb-5">
                <PlusCodePicker
                  onCapture={(capLat, capLng, capAddress, capPlusCode) => {
                    setLat(capLat)
                    setLng(capLng)
                    setCapturedAddress(capAddress)
                    setCapturedPlusCode(capPlusCode)
                    if (!address) setAddress(capAddress.split(',').slice(0, 2).join(','))
                  }}
                  onClear={() => {
                    setLat(null)
                    setLng(null)
                    setCapturedAddress('')
                    setCapturedPlusCode('')
                  }}
                  captured={lat !== null}
                  capturedAddress={capturedAddress}
                  capturedLat={lat ?? undefined}
                  capturedLng={lng ?? undefined}
                  capturedPlusCode={capturedPlusCode || undefined}
                />
              </div>

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

            {/* ── Section 4: Virtual tour ───────────────────────────── */}
            <section className={SECTION}>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-6 h-6 bg-accent flex items-center justify-center font-sans font-bold text-[11px] text-white flex-shrink-0">4</span>
                <h2 className="font-sans font-bold text-[13px] text-ink uppercase tracking-[1px]">Virtual Tour</h2>
                <span className="font-sans text-[9px] border border-border text-muted px-2 py-0.5 uppercase tracking-wide">Optional</span>
              </div>
              <p className="font-sans text-[11px] text-muted mb-6 ml-9">Help seekers explore your property without visiting</p>

              {/* Video tour — in-browser recorder */}
              <div className="mb-5">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f0e0c', marginBottom: '8px', display: 'block' }}>
                  Virtual Tour (optional)
                </label>
                <p style={{ fontSize: '12px', color: '#6b6055', marginBottom: '12px' }}>
                  Record a silent walkthrough of your property. Renters can view it before visiting.
                </p>
                {videoUrl ? (
                  <div>
                    {/* Video preview player */}
                    <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000', position: 'relative', marginBottom: '10px' }}>
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        style={{ width: '100%', maxHeight: '260px', display: 'block', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(26,107,74,0.08)', borderRadius: '8px' }}>
                      <span style={{ color: '#1a6b4a', fontSize: '13px', fontWeight: 600 }}>✅ Virtual tour uploaded</span>
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        style={{ marginLeft: 'auto', fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        ✕ Remove &amp; re-record
                      </button>
                    </div>
                  </div>
                ) : (
                  <TourRecorder onUpload={(url) => setVideoUrl(url)} />
                )}
              </div>

              {/* 360° photo */}
              <div className="border border-border p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌐</span>
                    <p className="font-sans font-bold text-[13px] text-ink">360° Photo Tour</p>
                  </div>
                  <p className="font-sans text-[11px] text-muted mb-4">
                    Take a 360° photo with your phone camera app and upload it.
                  </p>

                  {tourImageUrl ? (
                    <div className="mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tourImageUrl} alt="360° preview" className="w-full h-32 object-cover" />
                      <button
                        type="button"
                        onClick={() => setTourImageUrl('')}
                        className="font-sans text-[11px] text-muted hover:text-red transition-colors mt-2"
                      >
                        ✕ Remove photo
                      </button>
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-2 border border-dashed border-border2 py-4 cursor-pointer hover:bg-surface2 transition-colors ${tourImgUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setTourImgError('')
                          setTourImgUploading(true)
                          try {
                            const fd = new FormData()
                            fd.append('file', file)
                            const res = await fetch('/api/upload', { method: 'POST', body: fd })
                            const data = await res.json()
                            if (!res.ok) { setTourImgError(data.error ?? 'Upload failed'); return }
                            setTourImageUrl(data.url)
                          } catch {
                            setTourImgError('Upload failed — try again')
                          } finally {
                            setTourImgUploading(false)
                          }
                        }}
                      />
                      <span className="font-sans text-[12px] text-muted">
                        {tourImgUploading ? 'Uploading…' : '⬆ Upload 360° photo (JPEG or PNG)'}
                      </span>
                    </label>
                  )}
                  {tourImgError && <p className="font-sans text-[11px] text-red mt-1">{tourImgError}</p>}

                  <div className="mt-4 bg-surface2 px-3 py-3">
                    <p className="font-sans text-[10px] text-muted leading-relaxed">
                      💡 <strong>How to take a 360° photo:</strong> iPhone: Panoramic mode in Camera · Android: Google Street View app → Create → Take a Photo Sphere · Stand in the center of the room · Rotate slowly in a full circle
                    </p>
                  </div>
                </div>
            </section>

            {/* ── Section 5: Kenya details ──────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={5} title="Kenya details" />

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

            {/* ── Section 6: Features & amenities ──────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={6} title="Features & amenities" />

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

            </section>

            {/* ── Section 7: Submit ──────────────────────────────────── */}
            <section className={SECTION}>
              <SectionHeader num={7} title="Publish listing" />

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
