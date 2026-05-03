const browseLinks = [
  { label: 'All listings', href: '/browse' },
  { label: 'Map view', href: '/browse?view=map' },
  { label: 'By estate', href: '/browse?view=estates' },
  { label: 'New listings', href: '/browse?sort=newest' },
]

const landlordLinks = [
  { label: 'List property', href: '/dashboard/add' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Dashboard', href: '/dashboard' },
]

const companyLinks = [
  { label: 'About us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

function LinkColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="font-sans text-[8px] uppercase tracking-[2px] text-white/20 mb-4">{title}</p>
      <div className="flex flex-col gap-2.5">
        {links.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="font-sans font-light text-[12px] text-white/40 hover:text-white transition-colors"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-ink">
      <div className="px-16 pt-14 pb-8 grid grid-cols-[2fr_1fr_1fr_1fr] gap-16">
        <div>
          <p className="font-sans font-black text-[18px] tracking-tight mb-3">
            <span className="text-white">Pata</span>
            <span className="text-accent">Crib</span>
          </p>
          <p className="font-sans font-light text-[12px] text-white/35 leading-relaxed max-w-[220px]">
            Nairobi&apos;s most precise rental platform. GPS-verified listings
            with real neighbourhood intelligence.
          </p>
        </div>

        <LinkColumn title="Browse" links={browseLinks} />
        <LinkColumn title="Landlords" links={landlordLinks} />
        <LinkColumn title="Company" links={companyLinks} />
      </div>

      <div
        className="flex items-center justify-between px-16 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="font-sans font-light text-[11px] text-white/30">
          © 2025 PataKrib Kenya Ltd
        </p>
        <div className="flex items-center gap-5">
          {['Privacy', 'Terms', 'Cookies'].map((link) => (
            <a
              key={link}
              href={`/${link.toLowerCase()}`}
              className="font-sans font-light text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
