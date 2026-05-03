interface SeekerStatsProps {
  savedCount:        number
  conversationCount: number
  unreadCount:       number
  viewCount:         number
}

export default function SeekerStats({
  savedCount,
  conversationCount,
  unreadCount,
  viewCount,
}: SeekerStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">

      {/* Saved properties — dark card */}
      <div className="bg-ink px-6 py-5">
        <p className="font-serif text-[40px] text-white leading-none mb-1">{savedCount}</p>
        <p className="font-sans text-[11px] uppercase tracking-[0.8px] mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Saved properties
        </p>
        <p className="font-sans italic text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Properties you liked
        </p>
      </div>

      {/* Messages */}
      <div className="bg-surface border border-border px-6 py-5">
        <p className={`font-serif text-[40px] leading-none mb-1 ${unreadCount > 0 ? 'text-accent' : 'text-ink'}`}>
          {conversationCount}
        </p>
        <p className="font-sans text-[11px] uppercase tracking-[0.8px] text-muted mb-0.5">
          Messages
        </p>
        <p className="font-sans text-[11px] text-muted2">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
      </div>

      {/* Views */}
      <div className="bg-surface border border-border px-6 py-5">
        <p className="font-serif text-[40px] text-ink leading-none mb-1">{viewCount}</p>
        <p className="font-sans text-[11px] uppercase tracking-[0.8px] text-muted mb-0.5">
          Properties viewed
        </p>
        <p className="font-sans italic text-[11px] text-muted2">This session</p>
      </div>

    </div>
  )
}
