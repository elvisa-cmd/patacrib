interface PropertyStat {
  title:  string
  _count: { views: number; savedBy: number }
}

interface PerformanceRowProps {
  mostViewed: PropertyStat | null
  mostSaved:  PropertyStat | null
}

export default function PerformanceRow({ mostViewed, mostSaved }: PerformanceRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">

      {/* Most viewed */}
      <div className="bg-surface border border-border px-6 py-5">
        <p className="font-sans text-[9px] uppercase tracking-[1.2px] text-muted mb-3">
          Most viewed
        </p>
        {mostViewed ? (
          <>
            <p className="font-sans font-bold text-[14px] text-ink truncate mb-2">
              {mostViewed.title}
            </p>
            <p className="font-serif text-[28px] text-accent leading-none">
              {mostViewed._count.views}
            </p>
            <p className="font-sans text-[10px] text-muted mt-0.5">total views</p>
          </>
        ) : (
          <p className="font-sans text-[12px] text-muted italic">No data yet</p>
        )}
      </div>

      {/* Most saved */}
      <div className="bg-surface border border-border px-6 py-5">
        <p className="font-sans text-[9px] uppercase tracking-[1.2px] text-muted mb-3">
          Most saved
        </p>
        {mostSaved ? (
          <>
            <p className="font-sans font-bold text-[14px] text-ink truncate mb-2">
              {mostSaved.title}
            </p>
            <p className="font-serif text-[28px] text-accent leading-none">
              {mostSaved._count.savedBy}
            </p>
            <p className="font-sans text-[10px] text-muted mt-0.5">saves</p>
          </>
        ) : (
          <p className="font-sans text-[12px] text-muted italic">No data yet</p>
        )}
      </div>

      {/* Response rate */}
      <div className="bg-surface border border-border px-6 py-5">
        <p className="font-sans text-[9px] uppercase tracking-[1.2px] text-muted mb-3">
          Response rate
        </p>
        <p className="font-serif text-[28px] text-accent leading-none mb-2">98%</p>
        <div className="h-0.5 bg-border overflow-hidden mb-2">
          <div className="h-full bg-accent" style={{ width: '98%' }} />
        </div>
        <p className="font-sans text-[11px] text-muted">&lt; 1 hour response time</p>
      </div>

    </div>
  )
}
