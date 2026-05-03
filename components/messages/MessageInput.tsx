'use client'

import { useState, useRef, useCallback } from 'react'

interface MessageInputProps {
  onSend:    (content: string) => Promise<void>
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input,   setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const ta = ref.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`
  }

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || sending || disabled) return
    setSending(true)
    setInput('')
    if (ref.current) ref.current.style.height = 'auto'
    await onSend(content)
    setSending(false)
    ref.current?.focus()
  }, [input, sending, disabled, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim().length > 0 && !sending && !disabled

  return (
    <div className="flex items-end gap-3 px-4 py-3 bg-surface border-t border-border">
      <textarea
        ref={ref}
        value={input}
        onChange={e => { setInput(e.target.value); adjustHeight() }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled || sending}
        className="flex-1 bg-surface2 border border-border px-3 py-2.5 font-sans text-[13px] text-ink placeholder:text-muted resize-none focus:outline-none focus:border-border2 transition-colors disabled:opacity-60"
        style={{ minHeight: '40px', maxHeight: '96px', overflow: 'hidden' }}
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className="w-10 h-10 flex-shrink-0 rounded-full bg-accent flex items-center justify-center hover:bg-accent-d transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
