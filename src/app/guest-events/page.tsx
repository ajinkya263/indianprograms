import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventCard from '@/components/EventCard'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Event } from '@/lib/types'

export default async function GuestEventsPage() {
  const supabase = createServerSupabaseClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .neq('submitter_email', '')
    .eq('status', 'published')
    .order('date', { ascending: true })

  const eventList = (events || []) as Event[]

  return (
    <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#E8970A' }}
          >
            Community Submitted Events
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Events shared by our community members
          </p>
        </div>

        {eventList.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center">
            <p className="text-gray-500 text-sm">No community events yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventList.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
