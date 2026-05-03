export default function HeroHeadline() {
  return (
    <section className="pt-[72px] px-16 pb-10 grid grid-cols-2 gap-16 items-start">
      <div>
        <div className="inline-flex items-center gap-2 bg-accent-l text-accent px-3 py-1.5 text-[11px] font-sans font-medium uppercase tracking-[1px] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Nairobi · GPS verified
        </div>

        <h1 className="font-serif text-[64px] leading-[1.08] font-normal text-ink">
          Find your
          <br />
          <em className="text-accent" style={{ fontStyle: 'italic' }}>exact</em> home
          <br />
          in the city.
        </h1>
      </div>

      <div className="flex flex-col justify-center pt-[60px]">
        <p className="font-sans font-light text-[14px] text-muted leading-[1.8] max-w-[320px] mb-8">
          Every listing pinned to the metre. See the real location, matatu
          routes, water schedule, and safety score — before you visit.
        </p>

        <div className="flex items-center gap-5">
          <a
            href="/browse?view=map"
            aria-label="Explore properties on the map"
            className="font-sans font-bold text-[13px] uppercase tracking-[0.5px] bg-ink text-white px-6 py-3 hover:bg-accent-d transition-colors"
          >
            Explore on map
          </a>
          <a
            href="/browse"
            aria-label="Browse all listings"
            className="font-sans font-normal text-[13px] text-muted hover:text-ink transition-colors"
          >
            Browse listings →
          </a>
        </div>
      </div>
    </section>
  )
}
