import Nav    from '@/components/home/Nav'
import Footer from '@/components/home/Footer'
import ContactForm from './ContactForm'

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[60px]">

        {/* Header */}
        <div className="px-4 md:px-16 py-16 md:py-20 border-b border-border">
          <div className="max-w-[600px]">
            <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-4">
              Contact
            </p>
            <h1 className="font-serif text-[44px] md:text-[56px] text-ink leading-tight mb-4">
              We&apos;d love to hear from you.
            </h1>
            <p className="font-sans font-light text-[15px] text-muted leading-[1.8]">
              Whether you&apos;re a lister with questions, a seeker who needs help, or a partner who
              wants to work with us — our inbox is always open.
            </p>
          </div>
        </div>

        {/* Two column */}
        <div className="px-4 md:px-16 py-14">
          <div className="grid md:grid-cols-2 gap-12 max-w-[900px]">

            {/* Left — contact info */}
            <div>
              <h2 className="font-serif text-[22px] text-ink mb-6">Get in touch</h2>
              <div className="flex flex-col gap-6">
                {[
                  {
                    label: 'General enquiries',
                    email: 'hello@patacrib.co.ke',
                    desc:  'Questions about the platform, feedback, or anything else.',
                  },
                  {
                    label: 'Listers',
                    email: 'landlords@patacrib.co.ke',
                    desc:  'Help listing a property, managing your account, or understanding features.',
                  },
                  {
                    label: 'Support',
                    email: 'support@patacrib.co.ke',
                    desc:  'Technical issues, login problems, or missing listings.',
                  },
                  {
                    label: 'Legal & privacy',
                    email: 'legal@patacrib.co.ke',
                    desc:  'Privacy requests, takedown notices, or legal correspondence.',
                  },
                ].map(({ label, email, desc }) => (
                  <div key={email}>
                    <p className="font-sans font-bold text-[11px] uppercase tracking-[1px] text-muted mb-1">{label}</p>
                    <a
                      href={`mailto:${email}`}
                      className="font-sans text-[14px] text-accent hover:text-accent-d transition-colors"
                    >
                      {email}
                    </a>
                    <p className="font-sans text-[12px] text-muted mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-border">
                <p className="font-sans font-bold text-[11px] uppercase tracking-[1px] text-muted mb-2">
                  Response time
                </p>
                <p className="font-sans text-[13px] text-muted">
                  We typically respond within 24–48 hours on business days. For urgent issues, mark
                  your email subject line with <strong className="text-ink">URGENT</strong>.
                </p>
              </div>
            </div>

            {/* Right — contact form */}
            <ContactForm />

          </div>
        </div>

      </main>
      <Footer />
    </div>
  )
}
