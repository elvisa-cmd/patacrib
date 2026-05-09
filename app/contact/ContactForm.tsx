'use client'

import { useState } from 'react'

const INPUT    = 'w-full border border-border bg-surface px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-border2 placeholder:text-muted transition-colors'
const LABEL    = 'block font-sans text-[11px] uppercase tracking-[0.8px] text-muted mb-1.5'

export default function ContactForm() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent,    setSent]    = useState(false)
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setSending(true)
    setError(null)
    try {
      await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, subject, message }),
      })
      setSent(true)
    } catch {
      setError('Something went wrong. Please email us directly at hello@patacrib.co.ke')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-accent-l border border-accent/20 px-6 py-8 flex flex-col items-start">
        <span className="text-[32px] mb-4">✓</span>
        <h3 className="font-serif text-[22px] text-ink mb-2">Message sent!</h3>
        <p className="font-sans text-[13px] text-muted leading-relaxed">
          Thanks for reaching out. We&apos;ll get back to you at <strong className="text-ink">{email}</strong> within
          24–48 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="font-serif text-[22px] text-ink mb-6">Send a message</h2>

      <div className="mb-4">
        <label className={LABEL}>Your name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="John Kamau"
          className={INPUT}
          required
        />
      </div>

      <div className="mb-4">
        <label className={LABEL}>Email address *</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="john@example.com"
          className={INPUT}
          required
        />
      </div>

      <div className="mb-4">
        <label className={LABEL}>Subject</label>
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className={INPUT}
        >
          <option value="">Select a topic…</option>
          <option value="listing-help">Help with a listing</option>
          <option value="technical">Technical issue</option>
          <option value="report">Report a listing</option>
          <option value="partnership">Partnership enquiry</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mb-5">
        <label className={LABEL}>Message *</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          placeholder="Tell us how we can help…"
          className={INPUT + ' resize-none'}
          required
        />
      </div>

      {error && (
        <p className="font-sans text-[12px] text-red mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-[0.8px] py-3 hover:bg-accent-d transition-colors disabled:opacity-60"
      >
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
