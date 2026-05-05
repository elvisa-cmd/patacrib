const stats = [
  { number: '2,418', label: 'Active listings', sub: 'Across Nairobi' },
  { number: '100%', label: 'GPS verified', sub: 'Precise to 3 metres' },
  { number: '47', label: 'Estates covered', sub: 'Growing weekly' },
  { number: '4.9★', label: 'Landlord rating', sub: 'Verified profiles' },
]

const STAT_BORDERS = [
  'border-r border-b md:border-b-0 border-border',
  'md:border-r border-b md:border-b-0 border-border',
  'border-r border-border',
  '',
]

export default function StatsBar() {
  return (
    <section className="bg-surface border-t border-b border-border grid grid-cols-2 md:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`px-6 md:px-16 py-7 hover:bg-surface2 transition-colors cursor-default ${STAT_BORDERS[i]}`}
        >
          <p className="font-serif text-[36px] text-ink leading-none">{stat.number}</p>
          <p className="font-sans font-medium text-[11px] text-muted mt-2">{stat.label}</p>
          <p className="font-serif italic text-[11px] text-muted2 mt-0.5">{stat.sub}</p>
        </div>
      ))}
    </section>
  )
}
