'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen:        boolean
  onClose:       () => void
  propertyId:    string
  propertyTitle: string
}

export default function ViewingModal({ isOpen, onClose, propertyId, propertyTitle }: Props) {
  const router  = useRouter()
  const [message, setMessage] = useState(
    `Hi, I would like to schedule a viewing for this property. When would be a good time?`,
  )
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  if (!isOpen) return null

  const handleSend = async () => {
    const content = message.trim()
    if (!content) return
    setSending(true)
    setError(null)
    try {
      const res  = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ propertyId, content }),
      })
      const data = await res.json() as { error?: string }
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to send. Please try again.')
        return
      }
      router.push('/dashboard/messages')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <h3 className="font-serif text-[22px] text-ink mb-1">Book a viewing</h3>
          <p className="font-sans text-[12px] text-muted line-clamp-1">{propertyTitle}</p>
        </div>

        <div className="px-6 py-5">
          <p className="font-sans text-[12px] text-muted mb-3 leading-relaxed">
            Send a message to the landlord to arrange a viewing time.
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="w-full border border-border bg-surface2 font-sans text-[13px] text-ink px-3 py-2.5 focus:outline-none focus:border-border2 resize-none placeholder:text-muted"
            placeholder="Hi, I would like to schedule a viewing…"
          />
          {error && (
            <p className="font-sans text-[12px] text-red mt-2">{error}</p>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="w-full bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-[0.8px] py-3 hover:bg-accent-d transition-colors disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send viewing request'}
          </button>
          <button
            onClick={onClose}
            className="w-full font-sans text-[12px] text-muted py-2 hover:text-ink transition-colors text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
