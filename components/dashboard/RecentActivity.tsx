import { timeAgo } from '@/lib/utils'

interface RecentView {
  id:       string
  viewedAt: Date
  property: { title: string }
}

export default function RecentActivity({ views }: { views: RecentView[] }) {
  return (
    <div className="bg-surface border border-border mt-4">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-sans font-bold text-[13px] text-ink">Recent activity</h3>
      </div>

      {views.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="font-sans text-[12px] text-muted">No activity yet</p>
        </div>
      ) : (
        <ul>
          {views.map((v) => (
            <li
              key={v.id}
              className="flex items-start gap-3 px-5 py-3 border-b border-border last:border-0"
            >
              <span
                className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-sans text-[12px] text-ink leading-snug truncate">
                  Someone viewed{' '}
                  <span className="font-semibold">{v.property.title}</span>
                </p>
                <p className="font-sans text-[10px] text-muted2 mt-0.5">
                  {timeAgo(v.viewedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
