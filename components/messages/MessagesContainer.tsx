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
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        userId={userId}
      />
      <ChatWindow
        conversation={selectedConv}
        userId={userId}
        initialPropertyId={selectedId ? null : initialPropertyId}
        initialProperty={selectedId   ? null : initialProperty}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  )
}
