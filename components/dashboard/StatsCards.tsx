interface Stats {
  total:          number
  available:      number
  rented:         number
  totalViews:     number
  unreadMessages: number
}

export default function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">

      {/* Total listings — dark card */}
      <div className="bg-ink px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-default">
        <p className="font-serif text-[40px] text-white leading-none mb-2">
          {stats.total}
        </p>
        <p className="font-sans text-[11px] uppercase tracking-[1px] text-white/40 mb-1.5">
          Total listings
        </p>
        <p className="font-sans text-[10px] text-accent">+ this month</p>
      </div>

      {/* Available */}
      <div className="bg-surface border border-border px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
        <p className="font-serif text-[40px] text-ink leading-none mb-2">
          {stats.available}
        </p>
        <p className="font-sans text-[11px] uppercase tracking-[1px] text-muted mb-1">
          Available
        </p>
        <p className="font-sans text-[10px] italic text-muted2">Ready to rent</p>
      </div>

      {/* Total views */}
      <div className="bg-surface border border-border px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
        <p className="font-serif text-[40px] text-ink leading-none mb-2">
          {stats.totalViews}
        </p>
        <p className="font-sans text-[11px] uppercase tracking-[1px] text-muted mb-1">
          Total views
        </p>
        <p className="font-sans text-[10px] italic text-muted2">Across all listings</p>
      </div>

      {/* Unread messages */}
      <div className="bg-surface border border-border px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default">
        <p
          className={`font-serif text-[40px] leading-none mb-2 ${
            stats.unreadMessages > 0 ? 'text-accent' : 'text-ink'
          }`}
        >
          {stats.unreadMessages}
        </p>
        <p className="font-sans text-[11px] uppercase tracking-[1px] text-muted mb-1">
          Messages
        </p>
        {stats.unreadMessages > 0 ? (
          <p className="font-sans text-[10px] text-accent">
            {stats.unreadMessages} need{stats.unreadMessages === 1 ? 's' : ''} response
          </p>
        ) : (
          <p className="font-sans text-[10px] italic text-muted2">All caught up</p>
        )}
      </div>

    </div>
  )
}
