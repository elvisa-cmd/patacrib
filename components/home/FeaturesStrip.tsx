const features = [
  {
    icon:        '📍',
    label:       'GPS PINNED · 3M',
    href:        '/browse?view=map',
    description: 'Every property pinned to exact location',
  },
  {
    icon:        '🚌',
    label:       'MATATU ROUTES',
    href:        '/browse?hasMatatu=true',
    description: 'See matatu routes for every listing',
  },
  {
    icon:        '💧',
    label:       'WATER SCHEDULE',
    href:        '/browse?water=daily',
    description: 'Know water supply before you move in',
  },
  {
    icon:        '🔒',
    label:       'SAFETY SCORE',
    href:        '/browse?sort=safety',
    description: 'Safety ratings for every estate',
  },
  {
    icon:        '🎥',
    label:       'VIRTUAL TOURS',
    href:        '/browse?tour=true',
    description: 'View properties without visiting',
  },
  {
    icon:        '⚡',
    label:       'POWER BACKUP',
    href:        '/browse?power=true',
    description: 'Generator and solar backup information',
  },
  {
    icon:        '🗺',
    label:       'LIVE DIRECTIONS',
    href:        '/browse?view=map',
    description: 'In-app navigation to any property',
  },
]

export default function FeaturesStrip() {
  return (
    <div className="flex overflow-x-auto scrollbar-none bg-white border-b border-border">
      {features.map((feature, i) => (
        <a
          key={i}
          href={feature.href}
          className="flex items-center gap-2 px-6 py-4 border-r border-border flex-shrink-0 group hover:bg-accent-l transition-colors duration-200 cursor-pointer"
          title={feature.description}
        >
          <span className="text-base">{feature.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-muted group-hover:text-accent transition-colors duration-200 whitespace-nowrap">
            {feature.label}
          </span>
        </a>
      ))}
    </div>
  )
}
