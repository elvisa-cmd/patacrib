'use client'

import { useState } from 'react'
import PhotoUpload from './PhotoUpload'

// ── Design-system constants ──────────────────────────────────────────────────

const INPUT   = [
  'w-full border border-border bg-surface px-3 py-2.5',
  'font-sans text-[13px] text-ink',
  'focus:outline-none focus:border-border2 placeholder:text-muted',
  'transition-colors',
].join(' ')

const LABEL   = 'block font-sans text-[11px] uppercase tracking-[0.8px] text-muted mb-1.5'
const FIELD   = 'mb-5'
const GRID2   = 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5'
const SECTION = 'mb-10 pb-10 border-b border-border last:border-0 last:mb-0 last:pb-0'

const PROPERTY_TYPES = [
  { value: 'bedsitter',  label: 'Bedsitter'   },
  { value: 'studio',     label: 'Studio'      },
  { value: '1br',        label: '1 Bedroom'   },
  { value: '2br',        label: '2 Bedrooms'  },
  { value: '3br',        label: '3 Bedrooms'  },
  { value: '4br',        label: '4 Bedrooms'  },
  { value: 'maisonette', label: 'Maisonette'  },
  { value: 'bungalow',   label: 'Bungalow'    },
  { value: 'mansion',    label: 'Mansion'     },
  { value: 'commercial', label: 'Commercial'  },
]

// ── Types ────────────────────────────────────────────────────────────────────

interface PropertyData {
  id:            string
  title:         string
  description:   string
  price:         number
  priceType:     string
  bedrooms:      number
  bathrooms:     number
  propertyType:  string
  address:       string
  estate:        string | null
  city:          string
  latitude:      number
  longitude:     number
  images:        string[]
  videoUrl:      string | null
  features:      string[]
  amenities:     string[]
  waterSchedule: string | null
  matatuRoutes:  string[]
  safetyScore:   number | null
  powerBackup:   boolean
  borehole:      boolean
  status:        string
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-6 h-6 bg-accent flex items-center justify-center font-sans font-bold text-[11px] text-white flex-shrink-0">
        {num}
      </span>
      <h2 className="font-sans font-bold text-[13px] text-ink uppercase tracking-[1px]">{title}</h2>
    </div>
  )
}

function TagInput({
  tags, onAdd, onRemove, placeholder,
}: {
  tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder: string
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
        >+</button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 bg-surface border border-border font-sans text-[11px] text-ink px-2.5 py-1"
            >
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="text-muted hover:text-red transition-colors">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function EditPropertyForm({ property }: { property: PropertyData }) {
  // Section 1 — Basic info
  const [title,        setTitle]        = useState(property.title)
  const [description,  setDescription]  = useState(property.description)
  const [price,        setPrice]        = useState(String(property.price))
  const [priceType,    setPriceType]    = useState<'month' | 'year' | 'day'>(property.priceType as 'month' | 'year' | 'day')
  const [bedrooms,     setBedrooms]     = useState(property.bedrooms)
  const [bathrooms,    setBathrooms]    = useState(property.bathrooms)
  const [propertyType, setPropertyType] = useState(property.propertyType)
  const [status,       setStatus]       = useState(property.status)

  // Section 2 — Location (pre-confirmed from DB)
  const [address, setAddress] = useState(property.address)
  const [estate,  setEstate]  = useState(property.estate ?? '')
  const [city,    setCity]    = useState(property.city)

  // Section 3 — Photos
  const [images, setImages] = useState<string[]>(property.images)

  // Section 4 — Kenya details
  const [waterSchedule, setWaterSchedule] = useState(property.waterSchedule ?? '')
  const [matatuRoutes,  setMatatuRoutes]  = useState<string[]>(property.matatuRoutes)
  const [safetyScore,   setSafetyScore]   = useState(property.safetyScore != null ? String(property.safetyScore) : '')
  const [powerBackup,   setPowerBackup]   = useState(property.powerBackup)
  const [borehole,      setBorehole]      = useState(property.borehole)

  // Section 5 — Features & amenities
  const [features,  setFeatures]  = useState<string[]>(property.features)
  const [amenities, setAmenities] = useState<string[]>(property.amenities)
  const [videoUrl,  setVideoUrl]  = useState(property.videoUrl ?? '')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const doSubmit = async () => {
    if (title.length < 5)             { setError('Title must be at least 5 characters'); return }
    if (description.length < 20)      { setError('Description must be at least 20 characters'); return }
    if (!price || Number(price) <= 0) { setError('Price must be a positive number'); return }
    if (!propertyType)                { setError('Property type is required'); return }
    if (address.length < 5)           { setError('Address must be at least 5 characters'); return }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/properties/${property.id}`, {
        method:  'PATCH',
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
          images,
          videoUrl:      videoUrl      || undefined,
          features,
          amenities,
          waterSchedule: waterSchedule || undefined,
          matatuRoutes,
          safetyScore:   safetyScore ? Number(safetyScore) : undefined,
          powerBackup,
          borehole,
          status,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const fieldErrors = data.error
        if (typeof fieldErrors === 'object' && fieldErrors !== null) {
          const first = Object.values(fieldErrors as Record<string, string[]>)[0]
          setError(Array.isArray(first) ? first[0] : 'Validation failed')
        } else {
          setError((data.error as string) ?? 'Failed to update property')
        }
        return
      }

      window.location.href = '/dashboard/admin'
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
      <div className="px-4 py-5 md:px-16 md:py-8 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[1.2px] text-muted mb-1">
            Landlord dashboard
          </p>
          <h1 className="font-serif text-[28px] md:text-[32px] text-ink">Edit listing</h1>
        </div>
        <a
          href="/dashboard/admin"
          className="font-sans text-[12px] text-muted hover:text-ink transition-colors"
        >
          ← Back to dashboard
        </a>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 py-6 md:px-16 md:py-10 max-w-[800px] pb-28 md:pb-10">

          {/* ── Section 1: Basic info ───────────────────────────────── */}
          <section className={SECTION}>
            <SectionHeader num={1} title="Basic information" />

            <div className={FIELD}>
              <label className={LABEL}>Property title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={INPUT} />
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Property type</label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className={INPUT}>
                <option value="">Select type…</option>
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className={GRID2}>
              <div>
                <label className={LABEL}>Bedrooms</label>
                <input type="number" min={0} max={20} value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Bathrooms</label>
                <input type="number" min={0} max={20} value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))} className={INPUT} />
              </div>
            </div>

            <div className={GRID2}>
              <div>
                <label className={LABEL}>Rent (KSh)</label>
                <input type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Per</label>
                <select value={priceType} onChange={e => setPriceType(e.target.value as typeof priceType)} className={INPUT}>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="day">Day</option>
                </select>
              </div>
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className={INPUT}
              />
              <p className="font-sans text-[10px] text-muted mt-1">
                {description.length} characters
                {description.length < 20 ? ` · ${20 - description.length} more needed` : ' ✓'}
              </p>
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={INPUT}>
                <option value="available">Available</option>
                <option value="taken">Rented (taken)</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </section>

          {/* ── Section 2: Location ────────────────────────────────── */}
          <section className={SECTION}>
            <SectionHeader num={2} title="Location" />

            <div className="bg-surface2 border border-border px-4 py-3 mb-5">
              <p className="font-sans text-[11px] text-muted mb-2">Current GPS coordinates (set at listing time)</p>
              <div className="flex gap-8">
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[1px] text-muted2 mb-0.5">Latitude</p>
                  <p className="font-sans font-bold text-[13px] text-ink">
                    {Math.abs(property.latitude).toFixed(6)}° {property.latitude < 0 ? 'S' : 'N'}
                  </p>
                </div>
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[1px] text-muted2 mb-0.5">Longitude</p>
                  <p className="font-sans font-bold text-[13px] text-ink">
                    {Math.abs(property.longitude).toFixed(6)}° {property.longitude >= 0 ? 'E' : 'W'}
                  </p>
                </div>
              </div>
              <p className="font-sans text-[10px] text-muted mt-2">
                To update GPS coordinates, delete and re-create this listing.
              </p>
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Street address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={INPUT} />
            </div>

            <div className={GRID2}>
              <div>
                <label className={LABEL}>Estate / neighbourhood</label>
                <input type="text" value={estate} onChange={e => setEstate(e.target.value)} placeholder="e.g. Westlands" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} className={INPUT} />
              </div>
            </div>
          </section>

          {/* ── Section 3: Photos ──────────────────────────────────── */}
          <section className={SECTION}>
            <SectionHeader num={3} title="Photos" />
            <PhotoUpload
              urls={images}
              onAdd={url => setImages(prev => [...prev, url])}
              onRemove={url => setImages(prev => prev.filter(u => u !== url))}
            />
          </section>

          {/* ── Section 4: Kenya details ───────────────────────────── */}
          <section className={SECTION}>
            <SectionHeader num={4} title="Kenya details" />

            <div className={FIELD}>
              <label className={LABEL}>Water schedule</label>
              <input type="text" value={waterSchedule} onChange={e => setWaterSchedule(e.target.value)} placeholder="e.g. 24/7, Mon–Fri 6am–6pm" className={INPUT} />
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Safety score (0 – 10)</label>
              <input type="number" min={0} max={10} step={0.1} value={safetyScore} onChange={e => setSafetyScore(e.target.value)} placeholder="e.g. 8.5" className={INPUT} />
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Matatu routes</label>
              <TagInput
                tags={matatuRoutes}
                onAdd={t => setMatatuRoutes(prev => [...prev, t])}
                onRemove={t => setMatatuRoutes(prev => prev.filter(r => r !== t))}
                placeholder="e.g. Route 23 — press Enter to add"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={powerBackup} onChange={e => setPowerBackup(e.target.checked)} className="w-4 h-4 accent-accent" />
                <span className="font-sans text-[13px] text-ink">Power backup (generator / solar)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={borehole} onChange={e => setBorehole(e.target.checked)} className="w-4 h-4 accent-accent" />
                <span className="font-sans text-[13px] text-ink">Borehole</span>
              </label>
            </div>
          </section>

          {/* ── Section 5: Features & amenities ───────────────────── */}
          <section className={SECTION}>
            <SectionHeader num={5} title="Features & amenities" />

            <div className={FIELD}>
              <label className={LABEL}>Features</label>
              <TagInput
                tags={features}
                onAdd={t => setFeatures(prev => [...prev, t])}
                onRemove={t => setFeatures(prev => prev.filter(f => f !== t))}
                placeholder="e.g. Parking, Security — press Enter to add"
              />
            </div>

            <div className={FIELD}>
              <label className={LABEL}>Amenities</label>
              <TagInput
                tags={amenities}
                onAdd={t => setAmenities(prev => [...prev, t])}
                onRemove={t => setAmenities(prev => prev.filter(a => a !== t))}
                placeholder="e.g. Gym, Rooftop — press Enter to add"
              />
            </div>

            <div>
              <label className={LABEL}>Video tour URL (optional)</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className={INPUT} />
            </div>
          </section>

          {/* ── Section 6: Save ────────────────────────────────────── */}
          <section className={SECTION}>
            <SectionHeader num={6} title="Save changes" />

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
              {submitting ? 'Saving…' : 'Save changes'}
            </button>

            <p className="font-sans text-[11px] text-muted text-center mt-3">
              Changes are applied immediately and visible to seekers.
            </p>
          </section>

        </div>
      </form>

      {/* Mobile sticky save bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg border-t border-border px-4 py-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void doSubmit()}
          className="w-full bg-accent text-white font-sans font-bold text-[13px] uppercase tracking-[0.8px] py-4 hover:bg-accent-d transition-colors disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
