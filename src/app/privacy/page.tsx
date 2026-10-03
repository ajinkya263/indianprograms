import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | IndianPrograms',
  description: 'Privacy Policy for IndianPrograms — how we handle your data and protect your privacy.',
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-2 text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-400 mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        Last Updated: May 25, 2026
      </p>

      <div className="space-y-8 text-gray-300 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">1. Introduction</h2>
          <p>ZAXIS Ventures LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates IndianPrograms (&quot;the Website&quot;). This Privacy Policy explains how we collect, use, and protect information when you visit our Website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">2. Information We Collect</h2>
          <p>We are committed to minimal data collection:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>No account required for browsing:</strong> You can browse events and directory listings without creating an account.</li>
            <li><strong>localStorage only:</strong> We use your browser&apos;s localStorage to save preferences (such as favorite events or location settings). This data remains on your device and is never transmitted to our servers.</li>
            <li><strong>Account data:</strong> If you create an account to submit events or manage listings, we collect only the information you provide (email, name). This is stored securely and used solely for account functionality.</li>
            <li><strong>Event submissions:</strong> If you submit events or directory listings, the information you provide will be stored and displayed publicly on the Website.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">3. Cookies and Tracking</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do <strong>not</strong> use cookies for tracking or advertising purposes.</li>
            <li>Authentication cookies may be used solely for maintaining login sessions if you create an account.</li>
            <li>No third-party tracking cookies are placed on your device by us.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">4. Data Sharing</h2>
          <p>We do <strong>not</strong> sell, trade, rent, or otherwise share your personal information with third parties for marketing or advertising purposes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">5. Third-Party Services</h2>
          <p>Our Website may utilize the following third-party services which have their own privacy policies:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Google Fonts:</strong> For typography (may log IP addresses per Google&apos;s privacy policy)</li>
            <li><strong>Supabase:</strong> For authentication and data storage</li>
            <li><strong>News APIs:</strong> For community news content</li>
          </ul>
          <p className="mt-3">We encourage you to review the privacy policies of these third-party services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">6. Analytics</h2>
          <p>We may use privacy-respecting analytics to understand general usage patterns. If analytics are implemented, they do not collect personally identifiable information and do not use cookies for tracking.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">7. Children&apos;s Privacy (COPPA Compliance)</h2>
          <p>Our Website is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at zaxisventuresllc@gmail.com.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">8. California Consumer Privacy Act (CCPA)</h2>
          <p>If you are a California resident, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Know what personal information is collected about you</li>
            <li>Know whether your personal information is sold or disclosed and to whom</li>
            <li>Request deletion of your personal information</li>
            <li>Not be discriminated against for exercising your privacy rights</li>
          </ul>
          <p className="mt-3">To exercise these rights, contact us at zaxisventuresllc@gmail.com. We will respond within 45 days as required by law.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">9. International Users</h2>
          <p>This Website is operated from the United States. If you are accessing the Website from outside the United States, please be aware that any information you provide may be transferred to, stored, and processed in the United States. By using the Website, you consent to such transfer and processing.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">10. Data Retention</h2>
          <p>localStorage data is stored on your own device and is under your control. Account data is retained as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Event and directory submissions that have been published may remain on the Website even after account deletion.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Your continued use of the Website after any changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">12. Contact Information</h2>
          <p>For privacy-related questions or concerns, please contact:</p>
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
