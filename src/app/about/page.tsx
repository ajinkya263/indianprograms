import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'About IndianPrograms',
  description: 'Learn about IndianPrograms — your guide to discovering Indian cultural events across the United States.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070510] flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-12"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            About IndianPrograms
          </h1>

          <div className="space-y-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {/* What We Are */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                What We Are
              </h2>
              <p className="text-gray-300 leading-relaxed">
                IndianPrograms is a platform for discovering Indian cultural events across the
                United States. From Diwali celebrations in New York to Carnatic music concerts in
                the Bay Area, we bring together the richness of Indian culture happening in cities
                nationwide — all in one place.
              </p>
            </section>

            {/* Our Mission */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Our Mission
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Our mission is to connect the Indian diaspora with cultural events — festivals,
                concerts, classical dance performances, theater productions, workshops, spiritual
                gatherings, and more — in their cities. Whether you are new to a city or have lived
                there for decades, IndianPrograms helps you stay connected to the culture you love.
              </p>
            </section>

            {/* What We Do */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                What We Do
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We aggregate events from organizers, venues, and community organizations across
                the country. Publishers and event organizers can submit their events directly
                through our platform. We provide powerful search and discovery tools so you can
                find events by location, date, category, and more.
              </p>
            </section>

            {/* Community Driven */}
            <section>
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Community Driven
              </h2>
              <p className="text-gray-300 leading-relaxed">
                IndianPrograms is built by the community, for the community. Publishers and
                community members can submit events, suggest corrections, and help us maintain
                the most comprehensive directory of Indian cultural events in America. If you
                organize events, we invite you to join as a publisher and share your events with
                a wider audience.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="border border-white/10 rounded-xl p-6 bg-white/[0.02]">
              <h2
                className="text-2xl font-semibold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Disclaimer
              </h2>
              <p className="text-gray-400 leading-relaxed">
                IndianPrograms is an event discovery platform. We do not organize, host, or sell
                tickets for events listed on this platform. Event details are provided by organizers
                and third-party sources. We strive for accuracy but cannot guarantee all information
                is current or correct. Users should verify event details directly with organizers
                before attending.
              </p>
            </section>

            {/* Contact */}
            <section>
              <p className="text-gray-300 leading-relaxed">
                Have questions or want to get in touch? Visit our{' '}
                <Link href="/contact" className="text-[#E8970A] hover:underline">
                  Contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
