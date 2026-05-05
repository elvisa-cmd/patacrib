'use client'

import { useState } from 'react'
import ConversationList from './ConversationList'
import ChatWindow from './ChatWindow'

// ── Shared serialized types (dates as ISO strings) ────────────────────────

export interface ConvMessage {
  id:        string
  content:   string
  createdAt: string
  read:      boolean
  senderId:  string
}

export interface SerializedConversation {
  id:         string
  propertyId: string
  seekerId:   string
  landlordId: string
  updatedAt:  string
  property: {
    id:        string
    title:     string
    price:     number
    priceType: string
    images:    string[]
  }
  seeker: {
    id:   string
    name: string | null
  }
  landlord: {
    id:   string
    name: string | null
  }
  messages: ConvMessage[]
}

export interface InitialProperty {
  id:        string
  title:     string
  price:     number
  priceType: string
  images:    string[]
  adminId:   string
}

// ── Component ─────────────────────────────────────────────────────────────

interface MessagesContainerProps {
  conversations:         SerializedConversation[]
  userId:                string
  initialConversationId: string | null
  initialPropertyId:     string | null
  initialProperty:       InitialProperty | null
}

export default function MessagesContainer({
  conversations: initial,
  userId,
  initialConversationId,
  initialPropertyId,
  initialProperty,
}: MessagesContainerProps) {
  const [conversations, setConversations] = useState(initial)
  const [selectedId,    setSelectedId]    = useState<string | null>(initialConversationId)

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null

  const handleConversationCreated = (conv: SerializedConversation) => {
    setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)])
    setSelectedId(conv.id)
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Conversation list — full-width on mobile when no chat selected */}
      <div className={`w-full md:w-[300px] md:flex-shrink-0 border-r border-border overflow-y-auto ${
        selectedId ? 'hidden md:block' : 'block'
      }`}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userId={userId}
        />
      </div>

      {/* Chat window — full-width on mobile when conversation selected */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        selectedId ? 'flex' : 'hidden md:flex'
      }`}>
        {/* Mobile back button */}
        {selectedId && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border font-sans font-bold text-[13px] text-muted hover:text-ink transition-colors flex-shrink-0"
          >
            ← Back to messages
          </button>
        )}
        <ChatWindow
          conversation={selectedConv}
          userId={userId}
          initialPropertyId={selectedId ? null : initialPropertyId}
          initialProperty={selectedId   ? null : initialProperty}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  )
}
