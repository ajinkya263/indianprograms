import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getShortId, getSiteUrl } from '@/lib/constants'
import type { Event } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventBody from './EventBody'

interface PageProps {
  params: { shortId: string }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { shortId } = params
  const supabase = createServerSupabaseClient()

  // shortId is the first 7 hex chars of the UUID (dashes stripped), which
  // equals the first 7 chars of the UUID's first segment. Postgres refuses
  // ILIKE/LIKE on uuid columns, so we bracket the search with a range: any
  // UUID whose first segment starts with the shortId falls into
  // [shortId + '0-0000-…', shortId + 'f-ffff-…'].
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
    (events as Event[]).find((e) => getShortId(e.id) === shortId) ||
    (events as Event[])[0]

  if (!event) return notFound()

  const siteUrl = getSiteUrl()
  const shortUrl = `${siteUrl}/e/${shortId}`

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <EventBody event={event} shortId={shortId} shortUrl={shortUrl} />
      </main>

      <Footer />
    </div>
  )
}
