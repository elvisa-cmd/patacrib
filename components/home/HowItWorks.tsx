const steps = [
  {
    num: '01',
    title: 'Search your area',
    desc: 'Filter by estate, price, type, and distance from your location',
  },
  {
    num: '02',
    title: 'See the exact pin',
    desc: 'Every property is GPS-pinned to the metre — not just a neighbourhood',
  },
  {
    num: '03',
    title: 'Book and move in',
    desc: 'Message the landlord, book a viewing, and secure your home',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border grid grid-cols-4">
      <div className="bg-accent px-9 py-12">
        <p className="font-sans font-medium text-[8px] uppercase tracking-[2px] text-white/50 mb-6">
          How it works
        </p>
        <h2 className="font-serif text-[32px] text-white leading-tight">
          Renting{' '}
          <em className="text-gold" style={{ fontStyle: 'italic' }}>
            reinvented
          </em>
          <br />
          for Nairobi
        </h2>
        <p className="font-sans font-light text-[12px] text-white/60 mt-4 leading-relaxed">
          From search to signed lease, every step built for how Nairobi
          actually works.
        </p>
      </div>

      {steps.map((step, i) => (
        <div
          key={step.num}
          className={`px-9 py-12 bg-surface hover:bg-surface2 transition-colors ${
            i < 2 ? 'border-r border-border' : ''
          }`}
        >
          <p className="font-serif text-[52px] text-ink opacity-[0.06] leading-none mb-6 select-none">
            {step.num}
          </p>
          <p className="font-sans font-bold text-[13px] text-ink mb-3">{step.title}</p>
          <p className="font-sans font-light text-[11px] text-muted leading-[1.7]">{step.desc}</p>
        </div>
      ))}
    </section>
  )
}
