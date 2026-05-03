'use client'

import { useState } from 'react'
import PropertyCard from '@/components/shared/PropertyCard'
import { timeAgo } from '@/lib/utils'
import type { CardProperty } from '@/components/shared/PropertyCard'

export type SavedItem = {
  id:         string
  propertyId: string
  savedAt:    string
  property:   CardProperty & { createdAt: string }
}

interface SavedPropertiesProps {
  initialItems: SavedItem[]
}

export default function SavedProperties({ initialItems }: SavedPropertiesProps) {
  const [items, setItems] = useState(initialItems)

  async function handleUnsave(propertyId: string) {
    // Optimistic removal
    setItems(prev => prev.filter(i => i.propertyId !== propertyId))
    await fetch('/api/saved', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ propertyId }),
    })
  }

  return (
    <div className="bg-surface border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-sans font-bold text-[14px] text-ink">Saved Properties</h2>
        <a
          href="/browse"
          className="font-sans text-[12px] text-accent hover:text-accent-d transition-colors"
        >
          Browse more →
        </a>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
          <span className="text-[48px] leading-none mb-3" aria-hidden="true">♡</span>
          <p className="font-sans font-semibold text-[14px] text-ink mb-2">
            No saved properties yet
          </p>
          <p className="font-sans text-[12px] text-muted mb-5 max-w-[240px]">
            Browse properties and save the ones you like by clicking the heart icon
          </p>
          <a
            href="/browse"
            className="bg-accent text-white font-sans font-bold text-[11px] uppercase tracking-[0.8px] px-5 py-2.5 hover:bg-accent-d transition-colors"
          >
            Browse properties →
          </a>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id}>
              <PropertyCard
                property={item.property}
                mode="grid"
                isSaved
                onSave={() => handleUnsave(item.propertyId)}
              />
              <p className="font-sans text-[10px] text-muted mt-1.5 pl-0.5">
                Saved {timeAgo(new Date(item.savedAt))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
