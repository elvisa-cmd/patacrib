const STAT_BORDERS = [
  'border-r border-b md:border-b-0 border-border',
  'md:border-r border-b md:border-b-0 border-border',
  'border-r border-border',
  '',
]

interface StatsProps {
  totalListings:  number
  totalLandlords: number
  estatesCovered: number
  gpsVerified:    number
}

const DEFAULT_STATS: StatsProps = {
  totalListings:  0,
  totalLandlords: 0,
  estatesCovered: 0,
  gpsVerified:    100,
}

export default function StatsBar({ stats = DEFAULT_STATS }: { stats?: StatsProps }) {
  const items = [
    { number: stats.totalListings.toLocaleString(), label: 'Active listings',    sub: 'Across Nairobi'      },
    { number: '100%',                               label: 'GPS verified',       sub: 'Precise to 3 metres' },
    { number: stats.estatesCovered.toString(),      label: 'Estates covered',    sub: 'Growing weekly'      },
    { number: stats.totalLandlords.toString(),      label: 'Verified landlords', sub: 'Trusted profiles'    },
  ]

  return (
    <section className="bg-surface border-t border-b border-border grid grid-cols-2 md:grid-cols-4">
      {items.map((stat, i) => (
        <a
          key={stat.label}
          href="/browse"
          className={`block px-6 md:px-16 py-7 hover:bg-surface2 transition-colors cursor-pointer ${STAT_BORDERS[i]}`}
        >
          <p className="font-serif text-[36px] text-ink leading-none">{stat.number}</p>
          <p className="font-sans font-medium text-[11px] text-muted mt-2">{stat.label}</p>
          <p className="font-serif italic text-[11px] text-muted2 mt-0.5">{stat.sub}</p>
        </a>
      ))}
    </section>
  )
}
