import Link   from 'next/link'
import Nav    from '@/components/home/Nav'
import Footer from '@/components/home/Footer'

function PricingCard({
  tier,
  price,
  tagline,
  features,
  cta,
  ctaHref,
  highlight = false,
}: {
  tier:      string
  price:     string
  tagline:   string
  features:  string[]
  cta:       string
  ctaHref:   string
  highlight?: boolean
}) {
  return (
    <div className={`border flex flex-col ${highlight ? 'border-accent bg-accent-l' : 'border-border bg-surface'}`}>
      <div className={`px-7 pt-8 pb-6 border-b ${highlight ? 'border-accent/20' : 'border-border'}`}>
        {highlight && (
          <span className="inline-block font-sans font-bold text-[8px] uppercase tracking-[1.5px] bg-accent text-white px-2.5 py-1 mb-4">
            Current
          </span>
        )}
        <p className="font-sans font-bold text-[11px] uppercase tracking-[1.5px] text-muted mb-2">{tier}</p>
        <p className="font-serif text-[40px] text-ink leading-none mb-2">{price}</p>
        <p className="font-sans text-[13px] text-muted">{tagline}</p>
      </div>
      <div className="px-7 py-6 flex-1">
        <ul className="space-y-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-accent mt-0.5">✓</span>
              <span className="font-sans text-[13px] text-muted">{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-7 pb-7">
        <Link
          href={ctaHref}
          className={`block w-full text-center font-sans font-bold text-[12px] uppercase tracking-[0.8px] py-3 transition-colors ${
            highlight
              ? 'bg-accent text-white hover:bg-accent-d'
              : 'bg-ink text-white hover:bg-accent-d'
          }`}
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[60px]">

        {/* Header */}
        <div className="px-4 md:px-16 py-16 md:py-20 border-b border-border">
          <div className="max-w-[600px]">
            <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-4">
              Pricing
            </p>
            <h1 className="font-serif text-[44px] md:text-[56px] text-ink leading-tight mb-4">
              Simple, honest pricing.
            </h1>
            <p className="font-sans font-light text-[15px] text-muted leading-[1.8]">
              PataKrib is free during our beta. No hidden fees, no commissions, no listing charges.
              We want to earn your trust before we charge for anything.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="px-4 md:px-16 py-14">
          <div className="grid md:grid-cols-3 gap-6 max-w-[900px]">
            <PricingCard
              tier="Seeker"
              price="Free"
              tagline="Always free, no limits"
              features={[
                'Browse all GPS-verified listings',
                'Save favourites across devices',
                'In-app navigation to any property',
                'Message landlords directly',
                'View safety scores and matatu routes',
                'No account needed to browse',
              ]}
              cta="Start searching"
              ctaHref="/browse"
            />
            <PricingCard
              tier="Landlord Beta"
              price="Free"
              tagline="Free while we\'re in beta"
              highlight
              features={[
                'List unlimited properties',
                'GPS pin each property precisely',
                'Upload up to 20 photos per listing',
                'Receive messages from seekers',
                'Dashboard with views and analytics',
                'Status management (available / rented)',
              ]}
              cta="List your property"
              ctaHref="/signup"
            />
            <PricingCard
              tier="Landlord Pro"
              price="Coming soon"
              tagline="Premium features, launching soon"
              features={[
                'Everything in Landlord Beta',
                'Featured placement in search results',
                'Priority support',
                'Advanced analytics and insights',
                'Lead tracking and CRM tools',
                'Custom estate landing pages',
              ]}
              cta="Get notified"
              ctaHref="mailto:hello@patacrib.co.ke?subject=PataKrib Pro waitlist"
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="px-4 md:px-16 py-14 border-t border-border bg-surface">
          <div className="max-w-[600px]">
            <h2 className="font-serif text-[28px] text-ink mb-8">Frequently asked questions</h2>
            <div className="flex flex-col gap-8">
              {[
                {
                  q: 'Is PataKrib really free?',
                  a: 'Yes. During our beta period, all features for both seekers and landlords are completely free. We will give plenty of notice before introducing any paid plans.',
                },
                {
                  q: 'Does PataKrib take a commission?',
                  a: 'No. We are a listing platform, not an agent. We do not take any cut of rental transactions. All money goes directly between landlord and seeker.',
                },
                {
                  q: 'When will the paid Pro plan launch?',
                  a: 'We haven\'t set a date yet. We\'re focused on building the best free product first. Email hello@patacrib.co.ke to get notified when Pro launches.',
                },
                {
                  q: 'What happens to my listings when paid plans launch?',
                  a: 'Existing listings will remain active. We will grandfather early landlords into a generous free tier as a thank-you for supporting us in beta.',
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="font-sans font-bold text-[13px] text-ink mb-2">{q}</p>
                  <p className="font-sans text-[13px] text-muted leading-[1.8]">{a}</p>
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
