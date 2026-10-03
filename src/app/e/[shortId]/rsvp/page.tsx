import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getShortId } from '@/lib/constants'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RsvpForm from '@/components/RsvpForm'
import type { EventTier } from '@/lib/rsvp'

interface PageProps {
  params: { shortId: string }
}

export default async function EventRsvpPage({ params }: PageProps) {
  const { shortId } = params
  const supabase = createServerSupabaseClient()

  // Same UUID-range trick used by /e/[shortId] proper.
  const lo = `${shortId}0-0000-0000-0000-000000000000`
  const hi = `${shortId}f-ffff-ffff-ffff-ffffffffffff`
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('id', lo)
    .lte('id', hi)
    .limit(16)

  if (!events?.length) return notFound()
  const event =
    events.find((e: any) => getShortId(e.id) === shortId) || events[0]
  if (!event) return notFound()

  const rsvpEnabled: boolean = (event as any).rsvp_enabled === true
  const rsvpDeadline: string | null = (event as any).rsvp_deadline
  const deadlinePassed = rsvpDeadline ? new Date(rsvpDeadline) < new Date() : false

  const { data: tiers } = await supabase
    .from('event_tiers')
    .select('*')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link href={`/e/${shortId}`} className="inline-block mb-4 text-sm" style={{ color: 'var(--accent)' }}>
          ← Back to event
        </Link>

        {event.image_url && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-auto rounded-xl"
            />
          </div>
        )}

        <h1
          className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          RSVP: {event.title}
        </h1>
        <p className="text-sm text-gray-400 mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {event.date} · {event.venue || event.city}
        </p>

        {!rsvpEnabled ? (
          <div
            className="rounded-xl border p-6 text-center bg-[#0F0D1A] border-[#1A1726] text-gray-300"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            RSVP isn't open for this event.
          </div>
        ) : deadlinePassed ? (
          <div
            className="rounded-xl border p-6 text-center bg-[#0F0D1A] border-[#1A1726] text-gray-300"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            RSVP deadline has passed.
          </div>
        ) : (
          <RsvpForm
            eventId={event.id}
            eventTitle={event.title}
            paymentLink={(event as any).payment_link || ''}
            paymentInstructions={(event as any).payment_instructions || ''}
            tiers={(tiers as EventTier[] | null) || []}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}
