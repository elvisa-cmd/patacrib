'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PropertyActionsProps {
  propertyId:    string
  currentStatus: string
}

export default function PropertyActions({ propertyId, currentStatus }: PropertyActionsProps) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const ref    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const setStatus = async (status: string) => {
    setOpen(false)
    setLoading(true)
    await fetch(`/api/properties/${propertyId}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this property? This cannot be undone.')) return
    setOpen(false)
    setLoading(true)
    await fetch(`/api/properties/${propertyId}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="border border-border font-sans font-bold text-[12px] text-muted px-2.5 py-1 hover:border-border2 hover:text-ink transition-colors disabled:opacity-50"
        aria-label="More actions"
      >
        {loading ? '…' : '···'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border shadow-md z-50">
          {currentStatus !== 'available' && (
            <button
              onClick={() => setStatus('available')}
              className="block w-full text-left px-4 py-2.5 font-sans text-[12px] text-ink hover:bg-surface2 transition-colors"
            >
              Mark as available
            </button>
          )}
          {currentStatus !== 'taken' && (
            <button
              onClick={() => setStatus('taken')}
              className="block w-full text-left px-4 py-2.5 font-sans text-[12px] text-ink hover:bg-surface2 transition-colors"
            >
              Mark as rented
            </button>
          )}
          {currentStatus !== 'maintenance' && (
            <button
              onClick={() => setStatus('maintenance')}
              className="block w-full text-left px-4 py-2.5 font-sans text-[12px] text-ink hover:bg-surface2 transition-colors"
            >
              Mark as maintenance
            </button>
          )}
          <div className="border-t border-border" />
          <button
            onClick={handleDelete}
            className="block w-full text-left px-4 py-2.5 font-sans text-[12px] text-red hover:bg-surface2 transition-colors"
          >
            Delete listing
          </button>
        </div>
      )}
    </div>
  )
}
