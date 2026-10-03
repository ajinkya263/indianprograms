import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | IndianPrograms',
  description: 'Disclaimer for IndianPrograms — important information about event listings and directory content.',
}

export default function Disclaimer() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-2 text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
        Disclaimer
      </h1>
      <p className="text-sm text-gray-400 mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        Last Updated: May 25, 2026
      </p>

      <div className="space-y-8 text-gray-300 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">General Disclaimer</h2>
          <p>IndianPrograms is operated by ZAXIS Ventures LLC. All event listings, directory information, and cultural content provided on this Website are for <strong>general informational purposes only</strong>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Event Information</h2>
          <p>Regarding events listed on this Website:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Event information <strong>may change without notice</strong>. Dates, times, venues, performers, and ticket prices are subject to change by event organizers.</li>
            <li>We are NOT the organizers of listed events unless explicitly stated. We are an information aggregator and community platform.</li>
            <li>We are <strong>not responsible</strong> for event cancellations, postponements, venue changes, performer substitutions, or any other modifications.</li>
            <li>Always verify event details directly with the event organizer before making travel plans or purchasing tickets.</li>
            <li>We are not responsible for sold-out events, overbooked venues, or inability to obtain tickets.</li>
            <li>Event experiences (quality, safety, organization) are the responsibility of event organizers, not ZAXIS Ventures LLC.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Directory Listings</h2>
          <p>Regarding business and organization directory listings:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Listings do NOT constitute endorsement or recommendation by ZAXIS Ventures LLC.</li>
            <li>Business information (hours, services, contact details) may be outdated or inaccurate.</li>
            <li>We do not verify the credentials, licenses, or quality of listed businesses.</li>
            <li>Any transactions or interactions with listed businesses are solely between you and that business.</li>
            <li>We are not responsible for the quality of services provided by listed businesses.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">User-Submitted Content</h2>
          <p>Events and listings submitted by community members:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Are not independently verified for accuracy by ZAXIS Ventures LLC</li>
            <li>May contain errors, exaggerations, or misleading information</li>
            <li>Do not represent endorsement by ZAXIS Ventures LLC</li>
            <li>May be removed at our sole discretion without notice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Travel and Attendance</h2>
          <p>If you travel to attend an event listed on this Website:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>ZAXIS Ventures LLC is not responsible for travel expenses, hotel bookings, or other costs incurred.</li>
            <li>We strongly recommend confirming event details with organizers before traveling.</li>
            <li>We are not liable for any losses if an event is cancelled, moved, or different from its listing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Third-Party Links and Ticketing</h2>
          <p>This Website may link to third-party ticketing platforms, event organizer websites, and business websites. ZAXIS Ventures LLC:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Has no control over third-party websites or platforms</li>
            <li>Is not responsible for ticket purchase transactions on external platforms</li>
            <li>Cannot process refunds for tickets purchased through third parties</li>
            <li>Does not guarantee the security of third-party payment processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Cultural Content</h2>
          <p>Cultural information and descriptions:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Are general overviews and may not represent all perspectives or traditions</li>
            <li>Should not be considered authoritative cultural or religious guidance</li>
            <li>May contain simplifications of complex cultural practices</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Limitation of Liability</h2>
          <p>ZAXIS Ventures LLC shall not be held liable for any travel expenses, ticket costs, missed events, poor event experiences, interactions with listed businesses, or any other damages resulting from reliance on event listings, directory information, or other content provided by this Website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Contact Information</h2>
          <p>For questions regarding this Disclaimer, please contact:</p>
          <div className="mt-3 pl-4 border-l-2 border-gray-600">
            <p>ZAXIS Ventures LLC</p>
            <p>2108 N ST, STE N</p>
            <p>Sacramento, CA 95816</p>
            <p>Email: zaxisventuresllc@gmail.com</p>
          </div>
        </section>
      </div>
    </div>
  )
}
