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

export default async function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="font-sans text-[13px] text-muted">Last updated: May 2025</p>
          </div>

          {/* Content */}
          <Section title="1. Acceptance of Terms">
            <P>
              By accessing or using PataKrib you agree to be bound by these Terms of Service. If you
              do not agree to these terms, please do not use the platform. These terms constitute a
              binding legal agreement between you and PataKrib Kenya Ltd.
            </P>
          </Section>

          <Section title="2. Description of Service">
            <P>
              PataKrib is a property listing platform connecting landlords and property seekers across
              Kenya. We provide GPS-verified rental listings, in-app messaging, navigation tools, and
              neighbourhood intelligence including matatu routes, water schedules, and safety scores.
            </P>
            <P>
              PataKrib is a platform only. We do not own, manage, or operate any of the listed
              properties, and we are not a party to any rental agreement made through the platform.
            </P>
          </Section>

          <Section title="3. User Accounts">
            <P>To access certain features you must create an account. By creating an account you agree that:</P>
            <UL items={[
              'You must be 18 years of age or older to use PataKrib.',
              'You are responsible for maintaining the security of your account credentials.',
              'You must provide accurate, complete, and up-to-date information.',
              'You may only create one account per person.',
              'You must not share your account with others.',
              'You must notify us immediately of any unauthorised use of your account.',
            ]} />
            <P>
              We reserve the right to suspend or terminate accounts that violate these terms, engage
              in fraudulent activity, or are otherwise deemed harmful to the platform or its users.
            </P>
          </Section>

          <Section title="4. Landlord Responsibilities">
            <P>If you list a property on PataKrib, you agree to the following:</P>
            <UL items={[
              'All listings must be real properties that you own or are legally authorised to rent.',
              'GPS coordinates must accurately represent the property\'s location.',
              'Photos uploaded must be genuine photos of the actual property.',
              'Rental prices must be accurate and reflect current market rates.',
              'You must respond to seeker inquiries in a timely manner.',
              'You must keep your listing up to date — remove it when the property is no longer available.',
              'False, misleading, or fraudulent listings will result in immediate account termination.',
            ]} />
          </Section>

          <Section title="5. Seeker Responsibilities">
            <P>If you use PataKrib to search for a property, you agree to:</P>
            <UL items={[
              'Use the platform in good faith and only make genuine inquiries.',
              'Not spam landlords with unsolicited or abusive messages.',
              'Report suspicious or fraudulent listings to our support team.',
              'Always inspect a property in person before paying any deposit or signing any agreement.',
              'Conduct your own due diligence on any property before committing.',
            ]} />
            <P>
              PataKrib is not responsible for any transactions, agreements, or financial exchanges
              between landlords and seekers. These are solely between the parties involved.
            </P>
          </Section>

          <Section title="6. Prohibited Activities">
            <P>You may not use PataKrib to:</P>
            <UL items={[
              'Post fake, duplicate, or misleading property listings.',
              'Harass, threaten, or abuse other users.',
              'Use the platform for any illegal purpose under Kenyan law.',
              'Scrape, copy, or systematically extract data from the platform.',
              'Attempt to hack, disable, or disrupt any part of the service.',
              'Create multiple accounts or circumvent a ban.',
              'Impersonate another person or entity.',
              'Use automated bots or scripts to interact with the platform.',
            ]} />
          </Section>

          <Section title="7. GPS and Location Data">
            <P>
              PataKrib uses GPS data to accurately pin properties on our map. By listing a property,
              you consent to having its GPS coordinates stored and displayed publicly.
            </P>
            <UL items={[
              'Location data is used solely to display property positions on the map.',
              'We do not continuously track users\' locations.',
              'A landlord\'s GPS is captured once at listing time and stored with the listing.',
              'Seekers who use navigation features grant temporary location access via their browser.',
              'Location permissions are controlled by your browser — you may revoke them at any time.',
            ]} />
          </Section>

          <Section title="8. Payments and Transactions">
            <P>
              PataKrib does not process, hold, or facilitate any payments. All financial transactions
              are directly and exclusively between landlords and seekers. We are not responsible for
              any financial disputes, losses, or fraudulent transactions that arise from use of the
              platform.
            </P>
            <P>
              Never pay a deposit or advance rent without physically inspecting a property and
              verifying the landlord's identity. PataKrib will never ask you to send money through
              the platform.
            </P>
          </Section>

          <Section title="9. Intellectual Property">
            <P>
              All PataKrib content, branding, design, and code is the intellectual property of
              PataKrib Kenya Ltd and is protected under Kenyan and international copyright law.
            </P>
            <P>
              User-uploaded photographs remain the property of the uploader. By uploading photos,
              you grant PataKrib a non-exclusive, royalty-free licence to display them on the
              platform and in marketing materials.
            </P>
          </Section>

          <Section title="10. Limitation of Liability">
            <P>
              PataKrib is a listing platform only. We do not verify the physical condition,
              structural integrity, or legal status of any listed property. You should always
              conduct your own due diligence before signing any rental agreement.
            </P>
            <P>
              To the maximum extent permitted by Kenyan law, PataKrib shall not be liable for
              any indirect, incidental, or consequential losses arising from your use of the
              platform, including but not limited to financial losses, property damage, or personal
              injury.
            </P>
          </Section>

          <Section title="11. Changes to Terms">
            <P>
              We may update these terms at any time. We will notify registered users of significant
              changes by email. Your continued use of PataKrib after such notification constitutes
              your acceptance of the revised terms.
            </P>
          </Section>

          <Section title="12. Governing Law">
            <P>
              These Terms of Service are governed by and construed in accordance with the laws of
              Kenya. Any disputes arising from these terms shall be subject to the exclusive
              jurisdiction of the Kenyan courts.
            </P>
          </Section>

          <Section title="13. Contact">
            <P>For legal inquiries regarding these Terms of Service, please contact:</P>
            <P>
              <strong className="text-ink">Email:</strong>{' '}
              <a href="mailto:legal@patacrib.co.ke" className="text-accent hover:text-accent-d transition-colors">
                legal@patacrib.co.ke
              </a>
            </P>
            <P>PataKrib Kenya Ltd · Nairobi, Kenya</P>
          </Section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
