/**
 * Unified RSVP management endpoint.
 *
 * One route handles every publisher-side mutation — updating an RSVP's
 * status, editing a tier, and toggling the event's RSVP config. Auth is
 * dual-mode:
 *
 *   1. Guest publisher — payload includes `token`. We look up the event
 *      by `guest_edit_token` and, if it matches, run the mutation with
 *      the service-role key.
 *
 *   2. Registered publisher — no token needed. We verify the caller is
 *      authenticated (SSR cookie) and owns the event (publisher_id =
 *      auth.uid()) or is an admin.
 *
 * Both paths converge on the same DB writes.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

const VALID_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'attended', 'waitlist'])

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

/** Resolve event_id from either a guest token or authenticated caller. */
async function authorize(body: any): Promise<{ eventId: string; supabase: any } | { error: string; status: number }> {
  const eventId: string | undefined = body?.event_id
  const token: string | undefined = body?.token

  const service = createClient(SUPABASE_URL, SERVICE_ROLE)

  if (token) {
    // Guest — validate token → event.
    const { data: event } = await service
      .from('events')
      .select('id, guest_edit_token')
      .eq('guest_edit_token', token)
      .single()
    if (!event) return { error: 'Invalid or expired management link', status: 401 }
    if (eventId && event.id !== eventId) return { error: 'Token / event mismatch', status: 403 }
    return { eventId: event.id, supabase: service }
  }

  if (!eventId) return { error: 'Missing event_id', status: 400 }

  // Registered path — SSR auth via cookies.
  const cookieStore = await cookies()
  const authed = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => { /* read-only in this route */ },
    },
  })
  const { data: userWrap } = await authed.auth.getUser()
  const user = userWrap?.user
  if (!user) return { error: 'Not authenticated', status: 401 }

  const { data: event } = await service
    .from('events')
    .select('id, publisher_id')
    .eq('id', eventId)
    .single()
  if (!event) return { error: 'Event not found', status: 404 }

  if (event.publisher_id !== user.id) {
    // Admin escape hatch.
    const { data: prof } = await service.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') return { error: 'Not the event publisher', status: 403 }
  }

  return { eventId, supabase: service }
}

/** GET — refresh the tiers + rsvps for an event. Same auth as POST. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const body = {
    event_id: url.searchParams.get('event_id') || '',
    token: url.searchParams.get('token') || '',
  }
  const auth = await authorize(body)
  if ('error' in auth) return bad(auth.error, auth.status)
  const { eventId, supabase } = auth
  const [{ data: tiers }, { data: rsvps }] = await Promise.all([
    supabase.from('event_tiers').select('*').eq('event_id', eventId).order('sort_order', { ascending: true }),
    supabase.from('event_rsvps').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
  ])
  return NextResponse.json({ ok: true, tiers: tiers || [], rsvps: rsvps || [] })
}

export async function POST(request: Request) {
  let body: any
  try { body = await request.json() } catch { return bad('Invalid JSON body') }

  const auth = await authorize(body)
  if ('error' in auth) return bad(auth.error, auth.status)
  const { eventId, supabase } = auth
  const action = (body.action || '').toString()

  switch (action) {
    case 'set_rsvp_status': {
      const rsvpId = (body.rsvp_id || '').toString()
      const status = (body.status || '').toString()
      if (!rsvpId) return bad('Missing rsvp_id')
      if (!VALID_STATUSES.has(status)) return bad('Invalid status')
      const patch: any = { status }
      if (status === 'attended') patch.checked_in_at = new Date().toISOString()
      if (status !== 'attended') patch.checked_in_at = null
      const { error } = await supabase
        .from('event_rsvps')
        .update(patch)
        .eq('id', rsvpId)
        .eq('event_id', eventId)
      if (error) return bad(error.message, 500)
      return NextResponse.json({ ok: true })
    }

    case 'upsert_tier': {
      const t = body.tier || {}
      if (!t.name) return bad('Tier needs a name')
      const price = Math.max(0, Number(t.price) || 0)
      const capacity = t.capacity == null || t.capacity === '' ? null : Math.max(1, parseInt(t.capacity, 10) || 1)
      const sort_order = Number(t.sort_order) || 0
      if (t.id) {
        const { error } = await supabase.from('event_tiers').update({
          name: String(t.name).substring(0, 200),
          price,
          capacity,
          sort_order,
        }).eq('id', t.id).eq('event_id', eventId)
        if (error) return bad(error.message, 500)
      } else {
        const { error } = await supabase.from('event_tiers').insert({
          event_id: eventId,
          name: String(t.name).substring(0, 200),
          price,
          capacity,
          sort_order,
        })
        if (error) return bad(error.message, 500)
      }
      return NextResponse.json({ ok: true })
    }

    case 'delete_tier': {
      const tierId = (body.tier_id || '').toString()
      if (!tierId) return bad('Missing tier_id')
      const { error } = await supabase
        .from('event_tiers')
        .delete()
        .eq('id', tierId)
        .eq('event_id', eventId)
      if (error) return bad(error.message, 500)
      return NextResponse.json({ ok: true })
    }

    case 'update_event_rsvp_config': {
      const cfg: any = {}
      if ('rsvp_enabled' in body) cfg.rsvp_enabled = !!body.rsvp_enabled
      if ('rsvp_deadline' in body) cfg.rsvp_deadline = body.rsvp_deadline || null
      if ('rsvp_capacity' in body) cfg.rsvp_capacity = body.rsvp_capacity == null || body.rsvp_capacity === '' ? null : Math.max(1, parseInt(body.rsvp_capacity, 10) || 1)
      if ('payment_link' in body) cfg.payment_link = String(body.payment_link || '').substring(0, 1000)
      if ('payment_instructions' in body) cfg.payment_instructions = String(body.payment_instructions || '').substring(0, 5000)
      const { error } = await supabase.from('events').update(cfg).eq('id', eventId)
      if (error) return bad(error.message, 500)
      return NextResponse.json({ ok: true })
    }

    default:
      return bad('Unknown action')
  }
}
