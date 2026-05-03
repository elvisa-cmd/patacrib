const features = [
  { emoji: '📍', name: 'GPS pinned · 3m' },
  { emoji: '🚌', name: 'Matatu routes' },
  { emoji: '💧', name: 'Water schedule' },
  { emoji: '🔒', name: 'Safety score' },
  { emoji: '🎥', name: 'Virtual tours' },
  { emoji: '⚡', name: 'Power backup' },
  { emoji: '🗺', name: 'Live directions' },
]

export default function FeaturesStrip() {
  return (
    <section className="bg-surface border-b border-border overflow-x-auto scrollbar-none">
      <div className="flex min-w-max">
        {features.map((feature, i) => (
          <div
            key={feature.name}
            className={`flex items-center gap-2 px-7 py-4 border-r border-border hover:bg-accent-l group transition-colors cursor-default ${
              i === 0 ? 'border-l border-border' : ''
            }`}
          >
            <span role="img" aria-hidden="true">{feature.emoji}</span>
            <span className="font-sans font-medium text-[10px] uppercase tracking-[1px] text-muted group-hover:text-accent transition-colors whitespace-nowrap">
              {feature.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
