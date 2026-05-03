'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import type { SerializedConversation, InitialProperty } from './MessagesContainer'

// ── Types ─────────────────────────────────────────────────────────────────

interface ApiMessage {
  id:             string
  conversationId: string
  senderId:       string
  content:        string
  createdAt:      string
  read:           boolean
  sender: { id: string; name: string | null }
}

type ListItem =
  | { type: 'divider'; label: string; key: string }
  | { type: 'message'; msg: ApiMessage; idx: number; key: string }

// ── Helpers ───────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

function dateDividerLabel(dateStr: string): string {
  const d         = new Date(dateStr)
  const today     = new Date()
  const yesterday = new Date(Date.now() - 86400000)
  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function buildItems(messages: ApiMessage[]): ListItem[] {
  const items: ListItem[] = []
  let lastDate: string | null = null
  messages.forEach((msg, i) => {
    const ds = new Date(msg.createdAt).toDateString()
    if (ds !== lastDate) {
      items.push({ type: 'divider', label: dateDividerLabel(msg.createdAt), key: `d-${msg.id}` })
      lastDate = ds
    }
    items.push({ type: 'message', msg, idx: i, key: msg.id })
  })
  return items
}

// ── Component ─────────────────────────────────────────────────────────────

interface ChatWindowProps {
  conversation:          SerializedConversation | null
  userId:                string
  initialPropertyId:     string | null
  initialProperty:       InitialProperty | null
  onConversationCreated: (conv: SerializedConversation) => void
}

export default function ChatWindow({
  conversation,
  userId,
  initialPropertyId,
  initialProperty,
  onConversationCreated,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch messages whenever the selected conversation changes
  useEffect(() => {
    if (!conversation) { setMessages([]); return }
    setLoading(true)
    fetch(`/api/messages/${conversation.id}`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages as ApiMessage[]); setLoading(false) })
      .catch(() => setLoading(false))
  }, [conversation?.id])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async (content: string) => {
    if (conversation) {
      // Optimistic add
      const tmp: ApiMessage = {
        id:             `tmp-${Date.now()}`,
        conversationId: conversation.id,
        senderId:       userId,
        content,
        createdAt:      new Date().toISOString(),
        read:           false,
        sender:         { id: userId, name: null },
      }
      setMessages(prev => [...prev, tmp])

      const res  = await fetch(`/api/messages/${conversation.id}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === tmp.id ? (data.message as ApiMessage) : m))
      }
    } else if (initialPropertyId) {
      // Create a brand-new conversation
      const res  = await fetch('/api/messages', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ propertyId: initialPropertyId, content }),
      })
      const data = await res.json() as {
        conversation: {
          id: string; propertyId: string; seekerId: string; landlordId: string; updatedAt: string
          property: { id: string; title: string; price: number; priceType: string; images: string[] }
          seeker:   { id: string; name: string | null }
          landlord: { id: string; name: string | null }
        }
        message: ApiMessage
      }
      if (res.ok) {
        const newConv: SerializedConversation = {
          ...data.conversation,
          messages: [{
            id:        data.message.id,
            content:   data.message.content,
            createdAt: data.message.createdAt,
            read:      false,
            senderId:  data.message.senderId,
          }],
        }
        onConversationCreated(newConv)
        setMessages([data.message])
      }
    }
  }, [conversation, userId, initialPropertyId, onConversationCreated])

  // ── Empty state ────────────────────────────────────────────────────────
  if (!conversation && !initialPropertyId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg gap-3">
        <span className="text-[56px]" aria-hidden="true">💬</span>
        <p className="font-sans font-semibold text-[14px] text-ink">
          Select a conversation to start messaging
        </p>
        <p className="font-sans text-[12px] text-muted">Choose from the list on the left</p>
      </div>
    )
  }

  const other    = conversation
    ? (conversation.seekerId === userId ? conversation.landlord : conversation.seeker)
    : null
  const property = conversation?.property ?? initialProperty

  // Helpers for sequence detection (applied per-message with its original index)
  const showSenderName = (i: number) =>
    messages[i].senderId !== userId &&
    (i === 0 || messages[i - 1].senderId !== messages[i].senderId)

  const showTime = (i: number) =>
    i === messages.length - 1 ||
    messages[i + 1].senderId !== messages[i].senderId

  const items = buildItems(messages)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">

      {/* ── Chat header ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-surface border-b border-border px-5 py-3.5 flex items-center gap-3">
        {other && (
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-bold text-[12px] text-white">
              {getInitials(other.name)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-[14px] text-ink">
            {other?.name ?? 'New conversation'}
          </p>
          {property && (
            <p className="font-sans text-[11px] truncate">
              <span className="text-accent font-semibold">{property.title}</span>
              {' · '}
              <span className="text-muted">
                KSh {property.price.toLocaleString('en-KE')}/
                {property.priceType === 'month' ? 'mo' : property.priceType === 'year' ? 'yr' : 'day'}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── Messages area ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-bg">
        <div className="p-5 flex flex-col gap-1">

          {/* Property snippet card */}
          {property && (
            <div className="flex items-center gap-3 bg-surface border border-border p-3 mb-4">
              <div className="w-12 h-12 relative flex-shrink-0 overflow-hidden bg-surface2">
                {property.images[0] ? (
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl" aria-hidden="true">🏠</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-[12px] text-ink truncate">{property.title}</p>
                <p className="font-sans text-[11px] text-muted">
                  KSh {property.price.toLocaleString('en-KE')}/
                  {property.priceType === 'month' ? 'mo' : property.priceType === 'year' ? 'yr' : 'day'}
                </p>
              </div>
              <a
                href={`/property/${property.id}`}
                className="font-sans text-[11px] text-accent hover:text-accent-d transition-colors flex-shrink-0"
              >
                View listing →
              </a>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-2 mt-2">
              {[80, 60, 70, 50].map((w, i) => (
                <div
                  key={i}
                  className={`h-9 bg-surface2 animate-pulse ${i % 2 === 0 ? 'self-start' : 'self-end'}`}
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <p className="font-sans text-[12px] text-muted text-center mt-8">
              {initialPropertyId && !conversation
                ? 'Send a message to start the conversation'
                : 'No messages yet — say hello!'}
            </p>
          )}

          {/* Messages with date dividers */}
          {!loading && items.map(item => {
            if (item.type === 'divider') {
              return (
                <div key={item.key} className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-sans text-[10px] text-muted2 uppercase tracking-[0.8px]">
                    {item.label}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )
            }
            return (
              <MessageBubble
                key={item.key}
                content={item.msg.content}
                createdAt={item.msg.createdAt}
                isMine={item.msg.senderId === userId}
                senderName={item.msg.sender.name}
                showSenderName={showSenderName(item.idx)}
                showTime={showTime(item.idx)}
                read={item.msg.read}
              />
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Message input ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <MessageInput onSend={handleSend} />
      </div>

    </div>
  )
}
