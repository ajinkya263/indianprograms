import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | IndianPrograms',
  description: 'Terms of Service for IndianPrograms — an Indian cultural events portal by ZAXIS Ventures LLC.',
}

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-2 text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
        Terms of Service
      </h1>
      <p className="text-sm text-gray-400 mb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        Last Updated: May 25, 2026
      </p>

      <div className="space-y-8 text-gray-300 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using IndianPrograms (&quot;the Website&quot;), operated by ZAXIS Ventures LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use this Website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">2. Informational and Educational Purpose Only</h2>
          <p>All content on this Website, including but not limited to event listings, cultural information, community directory, and related content, is provided strictly for <strong>informational and educational purposes only</strong>.</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Content does NOT constitute professional advice of any kind.</li>
            <li>Event information, including dates, times, venues, and ticket prices, may change without notice and may be outdated or inaccurate.</li>
            <li>We are NOT the organizers of listed events unless explicitly stated. We are an information aggregator.</li>
            <li>We are not responsible for event cancellations, postponements, venue changes, or any other modifications made by event organizers.</li>
            <li>Directory listings are for informational purposes and do not constitute endorsement.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">3. No Warranties or Guarantees</h2>
          <p>This Website and all content are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied, including but not limited to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Warranties of merchantability or fitness for a particular purpose</li>
            <li>Accuracy, reliability, or completeness of event listings or directory information</li>
            <li>Uninterrupted or error-free operation of the Website</li>
            <li>Freedom from viruses or other harmful components</li>
            <li>Accuracy of event dates, times, venues, or pricing information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">4. Assumption of Risk</h2>
          <p>You expressly acknowledge and agree that your use of this Website and reliance on any information provided herein is <strong>entirely at your own risk</strong>. You should always verify event details directly with event organizers before attending or purchasing tickets.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">5. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ZAXIS VENTURES LLC, ITS MEMBERS, OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Travel expenses or costs incurred due to event cancellations or changes</li>
            <li>Losses resulting from reliance on event information or directory listings</li>
            <li>Any damages arising from your use or inability to use the Website</li>
            <li>Ticket purchases made based on information from this Website</li>
          </ul>
          <p className="mt-3">IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS ($100.00) OR THE AMOUNT YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, WHICHEVER IS LESS.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">6. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless ZAXIS Ventures LLC, its members, officers, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Your use of or reliance on the Website or its content</li>
            <li>Your violation of these Terms of Service</li>
            <li>Your violation of any rights of a third party</li>
            <li>Any events you submit or content you post on the Website</li>
            <li>Any interactions with event organizers or directory-listed businesses</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">7. No Guarantee of Availability</h2>
          <p>We do not guarantee that the Website will be available at all times or that it will be free from interruption, delay, or error. We reserve the right to modify, suspend, or discontinue the Website (or any part thereof) at any time without notice or liability.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">8. Right to Modify</h2>
          <p>ZAXIS Ventures LLC reserves the right to modify, update, or discontinue the Website, its content, features, or these Terms of Service at any time without prior notice. Your continued use of the Website after any changes constitutes acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">9. User-Generated Content</h2>
          <p>The Website allows users to submit events, directory listings, and other content. You acknowledge that:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>ZAXIS Ventures LLC is not responsible for user-submitted event information or directory content</li>
            <li>We do not endorse or verify the accuracy of user submissions</li>
            <li>You grant us a non-exclusive, royalty-free, perpetual license to use, modify, and display any content you submit</li>
            <li>We reserve the right to remove, edit, or reject any user content at our sole discretion</li>
            <li>You represent that any events or information you submit are accurate and do not infringe on third-party rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">10. Third-Party Links</h2>
          <p>This Website may contain links to third-party websites, ticketing platforms, event organizers, and businesses. ZAXIS Ventures LLC has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party sites. You access third-party links and conduct transactions with them entirely at your own risk.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">11. Intellectual Property</h2>
          <p>All original content on this Website, including text, graphics, logos, design, and software, is the property of ZAXIS Ventures LLC or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">12. Age Requirement</h2>
          <p>You must be at least 13 years of age to use this Website. By using this Website, you represent and warrant that you are at least 13 years old. If you are under 18, you represent that your parent or legal guardian has reviewed and agrees to these Terms.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">13. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">14. Dispute Resolution and Binding Arbitration</h2>
          <p>Any dispute, controversy, or claim arising out of or relating to these Terms or the use of this Website shall be resolved through <strong>binding arbitration</strong> in Sacramento County, California, in accordance with the rules of the American Arbitration Association. The arbitrator&apos;s decision shall be final and binding.</p>
          <p className="mt-3"><strong>CLASS ACTION WAIVER:</strong> YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. You expressly waive your right to participate in any class action lawsuits or class-wide arbitration.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">15. Severability</h2>
          <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions shall remain in full force and effect.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">16. Entire Agreement</h2>
          <p>These Terms of Service, together with our Privacy Policy and Disclaimer, constitute the entire agreement between you and ZAXIS Ventures LLC regarding the use of this Website and supersede all prior agreements, understandings, and communications.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">17. Contact Information</h2>
          <p>For questions regarding these Terms of Service, please contact:</p>
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
