import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Contact Us — IndianPrograms',
  description: 'Get in touch with the IndianPrograms team for inquiries, event submissions, and corrections.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#070510] flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-12"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Contact Us
          </h1>

          <div className="space-y-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {/* General Inquiries */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                General Inquiries
              </h2>
              <p className="text-gray-300 leading-relaxed">
                For general questions, feedback, or partnership opportunities, reach us at{' '}
                <a
                  href="mailto:info@indianprograms.com"
                  className="text-[#E8970A] hover:underline"
                >
                  info@indianprograms.com
                </a>
                .
              </p>
            </section>

            {/* Event Submissions */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Event Submissions
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Want to list your event on IndianPrograms? Use our{' '}
                <Link href="/submit" className="text-[#E8970A] hover:underline">
                  Submit Event
                </Link>{' '}
                page to add your event directly to the platform.
              </p>
            </section>

            {/* For Publishers */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                For Publishers
              </h2>
              <p className="text-gray-300 leading-relaxed">
                If you are an event organizer or community organization, you can{' '}
                <Link href="/register" className="text-[#E8970A] hover:underline">
                  register as a publisher
                </Link>{' '}
                to manage and promote your events on our platform.
              </p>
            </section>

            {/* Event Corrections */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Event Corrections
              </h2>
              <p className="text-gray-300 leading-relaxed">
                If you notice incorrect event information on our platform, please email us at{' '}
                <a
                  href="mailto:info@indianprograms.com"
                  className="text-[#E8970A] hover:underline"
                >
                  info@indianprograms.com
                </a>{' '}
                with the event details and the corrections needed. We will update it promptly.
              </p>
            </section>

            {/* Response Time */}
            <section className="border border-white/10 rounded-xl p-6 bg-white/[0.02]">
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Response Time
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We typically respond within 24-48 hours.
              </p>
              <p className="text-gray-400 leading-relaxed mt-4">
                IndianPrograms is a community-driven platform. We appreciate your patience and
                support in making this the best resource for Indian cultural events in America.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
