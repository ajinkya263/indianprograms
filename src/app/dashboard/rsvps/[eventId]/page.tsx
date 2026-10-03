import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PublisherRsvpClient from './PublisherRsvpClient'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { eventId: string }
}

export default async function PublisherEventRsvpPage({ params }: PageProps) {
  const { eventId } = params

  const cookieStore = await cookies()
  const authed = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => { /* read-only */ },
    },
  })
  const { data: userWrap } = await authed.auth.getUser()
  const user = userWrap?.user
  if (!user) return redirect(`/login?next=${encodeURIComponent(`/dashboard/rsvps/${eventId}`)}`)

  const service = createServiceClient(SUPABASE_URL, SERVICE_ROLE)
  const { data: event } = await service.from('events').select('*').eq('id', eventId).maybeSingle()
  if (!event) return notFound()

  // Ownership check — admin bypass.
  if ((event as any).publisher_id !== user.id) {
    const { data: prof } = await service.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') return notFound()
  }

  const [{ data: tiers }, { data: rsvps }] = await Promise.all([
    service.from('event_tiers').select('*').eq('event_id', eventId).order('sort_order', { ascending: true }),
    service.from('event_rsvps').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <PublisherRsvpClient
          event={event as any}
          initialTiers={(tiers as any[]) || []}
          initialRsvps={(rsvps as any[]) || []}
        />
      </main>
      <Footer />
    </div>
  )
}
