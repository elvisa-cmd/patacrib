'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [maxRent, setMaxRent] = useState('')
  const [bedrooms, setBedrooms] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (location) params.set('q',        location)
    if (type)     params.set('type',     type)
    if (maxRent)  params.set('maxPrice', maxRent)
    if (bedrooms) params.set('bedrooms', bedrooms)
    router.push(`/browse?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <section className="px-4 md:px-16 pb-7">
      <div className="max-w-[820px] bg-surface border border-border flex flex-col md:flex-row">
        <div className="flex-1 px-5 py-3 border-b md:border-b-0 md:border-r border-border">
          <p className="font-sans text-[8px] uppercase tracking-[1.2px] text-muted2 mb-1">
            Location
          </p>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Estate, street or area..."
            aria-label="Search by location"
            className="font-sans font-semibold text-[13px] text-ink placeholder:text-muted2 w-full outline-none bg-transparent"
          />
        </div>

        <div className="px-5 py-3 border-b md:border-b-0 md:border-r border-border">
          <p className="font-sans text-[8px] uppercase tracking-[1.2px] text-muted2 mb-1">
            Type
          </p>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by property type"
            className="font-sans font-semibold text-[13px] text-ink w-full outline-none bg-transparent cursor-pointer"
          >
            <option value="">Any type</option>
            <option value="bedsitter">Bedsitter</option>
            <option value="studio">Studio</option>
            <option value="1br">1 Bedroom</option>
            <option value="2br">2 Bedrooms</option>
            <option value="3br">3 Bedrooms</option>
            <option value="4br">4 Bedrooms</option>
            <option value="maisonette">Maisonette</option>
            <option value="bungalow">Bungalow</option>
          </select>
        </div>

        <div className="px-5 py-3 border-b md:border-b-0 md:border-r border-border">
          <p className="font-sans text-[8px] uppercase tracking-[1.2px] text-muted2 mb-1">
            Max rent
          </p>
          <select
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            aria-label="Filter by maximum rent"
            className="font-sans font-semibold text-[13px] text-ink w-full outline-none bg-transparent cursor-pointer"
          >
            <option value="">Any price</option>
            <option value="15000">Under KSh 15K</option>
            <option value="20000">Under KSh 20K</option>
            <option value="30000">Under KSh 30K</option>
            <option value="50000">Under KSh 50K</option>
            <option value="100000">Under KSh 100K</option>
          </select>
        </div>

        <div className="px-5 py-3 border-b md:border-b-0 md:border-r border-border">
          <p className="font-sans text-[8px] uppercase tracking-[1.2px] text-muted2 mb-1">
            Bedrooms
          </p>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            aria-label="Filter by number of bedrooms"
            className="font-sans font-semibold text-[13px] text-ink w-full outline-none bg-transparent cursor-pointer"
          >
            <option value="">Any</option>
            <option value="0">Studio</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>

        <button
          onClick={handleSearch}
          aria-label="Search properties"
          className="px-8 py-4 md:py-0 bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-[1px] hover:bg-accent-d transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </div>
    </section>
  )
}
