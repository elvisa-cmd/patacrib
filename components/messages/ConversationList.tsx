'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/utils'
import type { SerializedConversation } from './MessagesContainer'

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

interface ConversationListProps {
  conversations: SerializedConversation[]
  selectedId:    string | null
  onSelect:      (id: string) => void
  userId:        string
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  userId,
}: ConversationListProps) {
  const [search, setSearch] = useState('')

  const filtered = conversations.filter(c => {
    if (!search) return true
    const other = c.seekerId === userId ? c.landlord : c.seeker
    const q     = search.toLowerCase()
    return (
      (other.name?.toLowerCase() ?? '').includes(q) ||
      c.property.title.toLowerCase().includes(q)
    )
  })

  const totalUnread = conversations.reduce((sum, c) => {
    const last = c.messages[0]
    return sum + (last && last.senderId !== userId && !last.read ? 1 : 0)
  }, 0)

  return (
    <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-border bg-surface h-full">

      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <h2 className="font-serif text-[20px] text-ink">Messages</h2>
        {totalUnread > 0 && (
          <span className="bg-accent text-white font-sans font-bold text-[10px] px-1.5 py-0.5 min-w-[18px] text-center leading-none rounded-sm">
            {totalUnread}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="w-full bg-surface2 border border-border px-3 py-2 font-sans text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-border2 transition-colors"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-1">
            <p className="font-sans font-semibold text-[13px] text-ink">
              {search ? 'No results' : 'No conversations yet'}
            </p>
            <p className="font-sans text-[11px] text-muted">
              {search
                ? 'Try a different search term'
                : 'Messages from seekers will appear here'}
            </p>
          </div>
        ) : (
          filtered.map(c => {
            const isSelected = c.id === selectedId
            const other      = c.seekerId === userId ? c.landlord : c.seeker
            const lastMsg    = c.messages[0]
            const isUnread   = lastMsg && lastMsg.senderId !== userId && !lastMsg.read

            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={[
                  'w-full text-left px-4 py-3.5 border-b border-border',
                  'flex items-start gap-3 transition-colors',
                  'border-l-[3px]',
                  isSelected
                    ? 'bg-accent-l border-l-accent'
                    : 'hover:bg-surface2 border-l-transparent',
                ].join(' ')}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="font-sans font-bold text-[12px] text-white">
                    {getInitials(other.name)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="font-sans font-bold text-[13px] text-ink truncate">
                      {other.name ?? 'Unknown'}
                    </p>
                    <span className="font-sans text-[9px] text-muted2 flex-shrink-0">
                      {lastMsg
                        ? timeAgo(new Date(lastMsg.createdAt))
                        : timeAgo(new Date(c.updatedAt))}
                    </span>
                  </div>
                  <p className="font-sans font-bold text-[11px] text-accent truncate mb-0.5">
                    {c.property.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-[11px] text-muted truncate">
                      {lastMsg ? lastMsg.content : 'No messages yet'}
                    </p>
                    {isUnread && (
                      <span
                        className="w-2 h-2 rounded-full bg-accent flex-shrink-0"
                        aria-label="Unread message"
                      />
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
