import Nav    from '@/components/home/Nav'
import Footer from '@/components/home/Footer'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10 first:mt-0">
      <h2 className="font-serif text-[22px] text-ink mb-3">{title}</h2>
      {children}
    </div>
  )
}

const P  = ({ children }: { children: React.ReactNode }) => (
  <p className="font-sans text-[14px] text-muted leading-[1.8] mb-3">{children}</p>
)

const UL = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-2 font-sans text-[14px] text-muted mb-4 ml-1">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
)

export default async function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main className="pt-[60px]">
        <div className="max-w-[752px] mx-auto px-6 py-16 md:py-24">

          {/* Header */}
          <div className="mb-12 pb-8 border-b border-border">
            <p className="font-sans font-bold text-[9px] uppercase tracking-[2px] text-accent mb-4">
              Legal
            </p>
            <h1 className="font-serif text-[40px] md:text-[52px] text-ink leading-tight mb-3">
              Privacy Policy
            </h1>
            <p className="font-sans text-[13px] text-muted">Last updated: May 2025</p>
          </div>

          {/* Content */}
          <Section title="1. Introduction">
            <P>
              PataKrib Kenya Ltd operates patacrib.vercel.app (the &ldquo;Platform&rdquo;). This
              Privacy Policy explains how we collect, use, store, and protect your personal
              information when you use PataKrib. We are committed to protecting your privacy and
              handling your data responsibly in accordance with the Kenya Data Protection Act 2019.
            </P>
            <P>
              By using PataKrib, you consent to the collection and use of your information as
              described in this policy.
            </P>
          </Section>

          <Section title="2. Information We Collect">
            <p className="font-sans font-bold text-[13px] text-ink mb-2">Personal information (all users):</p>
            <UL items={[
              'Name and email address when you register an account.',
              'Phone number (optional, provided at your discretion).',
              'Password — stored as a one-way bcrypt hash; we never see your plain-text password.',
            ]} />

            <p className="font-sans font-bold text-[13px] text-ink mb-2">Property information (landlords only):</p>
            <UL items={[
              'Property address, description, and rental details.',
              'GPS coordinates captured at listing time.',
              'Property photographs you upload.',
              'Amenities, matatu routes, and other listing details you provide.',
            ]} />

            <p className="font-sans font-bold text-[13px] text-ink mb-2">Usage information:</p>
            <UL items={[
              'Properties you view (to support recently-viewed functionality).',
              'Properties you save (to populate your saved list).',
              'Messages you send and receive on the platform.',
              'Search queries and filters used (to improve search results).',
            ]} />

            <p className="font-sans font-bold text-[13px] text-ink mb-2">Location information:</p>
            <UL items={[
              'Your device\'s location when you use the map or in-app navigation features.',
              'Location access is only requested with your explicit browser permission.',
              'Real-time navigation location is never stored permanently on our servers.',
              'Landlord GPS is captured once at listing time and stored with the listing.',
            ]} />
          </Section>

          <Section title="3. How We Use Your Information">
            <P>We use the information we collect to:</P>
            <UL items={[
              'Provide and operate the PataKrib service.',
              'Connect property seekers with landlords.',
              'Display property locations accurately on our map.',
              'Enable in-app messaging between seekers and landlords.',
              'Show you relevant property listings and search results.',
              'Track property views and saves for landlord analytics.',
              'Send important service notifications (e.g., new messages, account updates).',
              'Detect and prevent fraudulent or abusive activity.',
              'Improve and develop the platform.',
            ]} />
          </Section>

          <Section title="4. Information Sharing">
            <P>
              <strong className="text-ink">We do not sell your personal data. Ever.</strong>
            </P>
            <P>We share information only in the following limited circumstances:</P>
            <UL items={[
              'Between seekers and landlords as part of the service — your name and messages are shared when you initiate a conversation.',
              'With Supabase, our database provider, whose servers are hosted in the European Union and comply with GDPR.',
              'With Vercel, our hosting provider, for the purpose of delivering the web application.',
              'When required by Kenyan law, a court order, or to protect the rights and safety of our users.',
            ]} />
          </Section>

          <Section title="5. Data Security">
            <P>We take the security of your data seriously. Our measures include:</P>
            <UL items={[
              'Passwords are hashed using bcrypt with a salt factor of 10 — they are never stored in plain text.',
              'All data is transmitted over HTTPS/TLS encryption.',
              'Our database is hosted on Supabase with encryption at rest.',
              'Access to the production database is restricted to authorised team members only.',
              'We regularly review and update our security practices.',
            ]} />
            <P>
              Despite these measures, no internet service can be 100% secure. Please use a strong,
              unique password and keep your credentials safe.
            </P>
          </Section>

          <Section title="6. Your Rights">
            <P>Under the Kenya Data Protection Act 2019, you have the right to:</P>
            <UL items={[
              'Access the personal data we hold about you.',
              'Correct inaccurate or incomplete data.',
              'Request deletion of your account and all associated data.',
              'Export your data in a portable format.',
              'Withdraw consent for any non-essential data processing.',
              'Object to processing of your personal data.',
            ]} />
            <P>
              To exercise any of these rights, email us at{' '}
              <a href="mailto:privacy@patacrib.co.ke" className="text-accent hover:text-accent-d transition-colors">
                privacy@patacrib.co.ke
              </a>
              . We will respond within 30 days.
            </P>
          </Section>

          <Section title="7. Data Retention">
            <UL items={[
              'Account data: retained while your account is active and for 90 days after deletion.',
              'Property listings: retained while the listing is active; deleted when you remove the listing.',
              'Messages: retained for 12 months from the date of the message.',
              'Property view logs: retained for 30 days for analytics purposes.',
              'Navigation location data: never stored; exists only in your browser session.',
            ]} />
          </Section>

          <Section title="8. Cookies">
            <P>We use a minimal number of cookies to operate the platform:</P>
            <UL items={[
              'Session cookie: required for login and keeping you signed in. This is an essential cookie.',
              'No advertising cookies.',
              'No third-party tracking cookies.',
              'No analytics cookies from third parties.',
            ]} />
            <P>
              You can control cookies through your browser settings. Disabling the session cookie
              will prevent you from logging in.
            </P>
          </Section>

          <Section title="9. Children&apos;s Privacy">
            <P>
              PataKrib is intended for users who are 18 years of age or older. We do not knowingly
              collect personal data from minors. If you believe a minor has created an account,
              please contact us at{' '}
              <a href="mailto:privacy@patacrib.co.ke" className="text-accent hover:text-accent-d transition-colors">
                privacy@patacrib.co.ke
              </a>{' '}
              and we will delete the account promptly.
            </P>
          </Section>

          <Section title="10. Changes to This Policy">
            <P>
              We may update this Privacy Policy from time to time. We will notify registered users
              of significant changes by email or by displaying a prominent notice on the platform.
              The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent revision.
            </P>
          </Section>

          <Section title="11. Contact Us">
            <P>For privacy questions, data requests, or concerns, please contact:</P>
            <P>
              <strong className="text-ink">Privacy enquiries:</strong>{' '}
              <a href="mailto:privacy@patacrib.co.ke" className="text-accent hover:text-accent-d transition-colors">
                privacy@patacrib.co.ke
              </a>
            </P>
            <P>
              <strong className="text-ink">Data Controller:</strong> PataKrib Kenya Ltd · Nairobi, Kenya
            </P>
          </Section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
