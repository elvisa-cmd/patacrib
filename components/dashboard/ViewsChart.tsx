'use client'

import { useState } from 'react'

interface DayData {
  day:   string
  count: number
}

// Mirrors tailwind design tokens — inline styles required for dynamic bar heights
const BAR_DEFAULT = '#d4e8dd'
const BAR_HOVER   = '#1a6b4a'

export default function ViewsChart({ data }: { data: DayData[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-surface border border-border mt-4">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-sans font-bold text-[13px] text-ink">Views this week</h3>
      </div>

      <div className="px-5 py-5">
        {/* Bars */}
        <div className="flex items-end gap-1.5" style={{ height: '80px' }}>
          {data.map((item, i) => {
            const isHovered = hovered === i
            const heightPct = item.count > 0
              ? Math.max(Math.round((item.count / maxCount) * 100), 8)
              : 3

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center justify-end cursor-default"
                style={{ height: '100%' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHovered && item.count > 0 && (
                  <span className="font-sans text-[9px] text-ink mb-1 leading-none">
                    {item.count}
                  </span>
                )}
                <div
                  style={{
                    width:      '100%',
                    height:     `${heightPct}%`,
                    background: isHovered ? BAR_HOVER : BAR_DEFAULT,
                    transition: 'background 0.15s',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Day labels */}
        <div className="flex gap-1.5 mt-2">
          {data.map((item) => (
            <div key={item.day} className="flex-1 text-center">
              <span className="font-sans text-[8px] uppercase text-muted">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
