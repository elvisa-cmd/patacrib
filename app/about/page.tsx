import Nav    from '@/components/home/Nav'
import Footer from '@/components/home/Footer'

export default async function AboutPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[60px]">

        {/* Hero */}
        <div className="px-4 md:px-16 py-16 md:py-24 border-b border-border">
          <div className="max-w-[752px]">
            <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-5">
              Our story
            </p>
            <h1 className="font-serif text-[44px] md:text-[64px] text-ink leading-[1.05] mb-6">
              Kenya&apos;s most precise
              <br />
              <em className="text-accent">rental platform.</em>
            </h1>
            <p className="font-sans font-light text-[16px] text-muted leading-[1.9] max-w-[560px]">
              PataKrib was built out of frustration. Finding a rental in Nairobi meant vague
              descriptions, wrong neighbourhoods, and wasted journeys. We decided to fix that — one
              GPS pin at a time.
            </p>
          </div>
        </div>

        {/* Mission */}
        <div className="px-4 md:px-16 py-14 border-b border-border bg-surface">
          <div className="max-w-[752px] grid md:grid-cols-2 gap-12">
            <div>
              <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-4">
                Our mission
              </p>
              <h2 className="font-serif text-[28px] text-ink mb-4">
                Make every rental search honest.
              </h2>
              <p className="font-sans text-[14px] text-muted leading-[1.8]">
                Every listing on PataKrib has a real GPS pin, a real photo, and real information
                about water, power, and matatu access. No vague &ldquo;near Westlands&rdquo; — you
                see the exact street, from your phone, before you spend time or money visiting.
              </p>
            </div>
            <div>
              <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-4">
                How we&apos;re different
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'GPS-verified pins', desc: 'Accurate to 3 metres — landlords capture location at the property entrance.' },
                  { label: 'Neighbourhood intelligence', desc: 'Water schedule, matatu routes, safety score, and borehole status on every listing.' },
                  { label: 'In-app navigation', desc: 'Get directions without leaving PataKrib — walk, matatu, or drive.' },
                  { label: 'Zero hidden fees', desc: 'Free for seekers, free for landlords during beta. No commissions, no listing fees.' },
                ].map(item => (
                  <div key={item.label} className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-sans font-bold text-[13px] text-ink">{item.label}</p>
                      <p className="font-sans text-[12px] text-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 md:px-16 py-14 border-b border-border">
          <div className="max-w-[752px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '100%', label: 'GPS verified listings' },
                { number: 'Free', label: 'For all seekers, forever' },
                { number: 'Nairobi', label: 'Launching first, expanding next' },
                { number: '2025', label: 'Founded in Kenya' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="font-serif text-[32px] text-ink leading-none mb-1">{stat.number}</p>
                  <p className="font-sans text-[11px] text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="px-4 md:px-16 py-14 border-b border-border bg-surface">
          <div className="max-w-[752px]">
            <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-5">
              The team
            </p>
            <h2 className="font-serif text-[28px] text-ink mb-8">Built in Nairobi, for Nairobi.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { initials: 'EA', role: 'Founder & Engineer', bio: 'Built PataKrib to solve a problem he faced firsthand: finding a reliable rental in Nairobi.' },
                { initials: 'TBA', role: 'Design & UX', bio: 'Coming soon — we\'re a lean team and proud of it. Want to join? Email us.' },
                { initials: 'TBA', role: 'Growth & Partnerships', bio: 'Know the Nairobi rental market? We\'d love to hear from you.' },
              ].map(person => (
                <div key={person.initials} className="border border-border p-5">
                  <div className="w-12 h-12 bg-accent flex items-center justify-center mb-4">
                    <span className="font-sans font-bold text-[14px] text-white">{person.initials}</span>
                  </div>
                  <p className="font-sans font-bold text-[12px] uppercase tracking-[0.8px] text-ink mb-1">{person.role}</p>
                  <p className="font-sans text-[12px] text-muted leading-relaxed">{person.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 md:px-16 py-14">
          <div className="max-w-[752px]">
            <h2 className="font-serif text-[28px] text-ink mb-3">Get in touch</h2>
            <p className="font-sans text-[14px] text-muted mb-5">
              For partnerships, press enquiries, or just to say hello:
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'General', email: 'hello@patacrib.co.ke' },
                { label: 'Landlords', email: 'landlords@patacrib.co.ke' },
                { label: 'Press', email: 'press@patacrib.co.ke' },
              ].map(({ label, email }) => (
                <div key={email} className="flex items-center gap-3">
                  <span className="font-sans text-[11px] uppercase tracking-[1px] text-muted w-20">{label}</span>
                  <a href={`mailto:${email}`} className="font-sans text-[14px] text-accent hover:text-accent-d transition-colors">
                    {email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
