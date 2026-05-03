import { timeAgo } from '@/lib/utils'

type ConvMessage = {
  id:        string
  content:   string
  createdAt: string
  read:      boolean
  senderId:  string
}

type RecentConversation = {
  id:        string
  propertyId: string
  updatedAt: string
  property:  { id: string; title: string }
  landlord:  { id: string; name: string | null }
  messages:  ConvMessage[]
}

interface RecentMessagesProps {
  conversations: RecentConversation[]
  userId:        string
  unreadCount:   number
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
}

export default function RecentMessages({
  conversations,
  userId,
  unreadCount,
}: RecentMessagesProps) {
  return (
    <div className="bg-surface border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border">
        <h2 className="font-sans font-bold text-[13px] text-ink flex-1">Messages</h2>
        {unreadCount > 0 && (
          <span className="bg-accent text-white font-sans font-bold text-[9px] px-1.5 py-0.5 min-w-[18px] text-center leading-none">
            {unreadCount}
          </span>
        )}
        <a
          href="/dashboard/messages"
          className="font-sans text-[11px] text-accent hover:text-accent-d transition-colors"
        >
          View all →
        </a>
      </div>

      {/* Empty state */}
      {conversations.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="font-sans text-[12px] text-muted mb-1">No messages yet</p>
          <p className="font-sans text-[11px] text-muted2">
            Message a landlord from any property listing
          </p>
        </div>
      ) : (
        <div>
          {conversations.map(conv => {
            const last     = conv.messages[0]
            const isUnread = last && last.senderId !== userId && !last.read
            return (
              <a
                key={conv.id}
                href="/dashboard/messages"
                className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface2 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-sans font-bold text-[10px] text-white">
                    {getInitials(conv.landlord.name)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="font-sans font-bold text-[12px] text-ink truncate">
                      {conv.landlord.name ?? 'Landlord'}
                    </p>
                    <span className="font-sans text-[9px] text-muted2 flex-shrink-0">
                      {last ? timeAgo(new Date(last.createdAt)) : timeAgo(new Date(conv.updatedAt))}
                    </span>
                  </div>
                  <p className="font-sans font-semibold text-[10px] text-accent truncate mb-0.5">
                    {conv.property.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-[11px] text-muted truncate">
                      {last ? last.content : 'No messages yet'}
                    </p>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" aria-label="Unread" />
                    )}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
