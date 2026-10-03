import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import GuestManagementClient from './GuestManagementClient'

interface PageProps {
  params: { token: string }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

export default async function GuestPage({ params }: PageProps) {
  const { token } = params
  if (!token || token.length < 20) return notFound()

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('guest_edit_token', token)
    .maybeSingle()
  if (!event) return notFound()

  const [{ data: tiers }, { data: rsvps }] = await Promise.all([
    supabase.from('event_tiers').select('*').eq('event_id', event.id).order('sort_order', { ascending: true }),
    supabase.from('event_rsvps').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <GuestManagementClient
          token={token}
          event={event as any}
          initialTiers={(tiers as any[]) || []}
          initialRsvps={(rsvps as any[]) || []}
        />
      </main>
      <Footer />
    </div>
  )
}
