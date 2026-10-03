/**
 * Attendee RSVP submission endpoint.
 *
 * Public — anyone can POST. We validate the input, check the tier /
 * event capacity to decide whether the RSVP is confirmed, pending, or
 * waitlisted, mint a short confirmation code, and email the attendee.
 * All DB work uses the service-role key so we don't rely on RLS
 * insert-with-check to compute status correctly (it can't do the
 * capacity join).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decideRsvpStatus, generateConfirmationCode, EventTier, EventRsvp } from '@/lib/rsvp'
import { sendEmail, renderEmail, escapeHtml } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE) return bad('Server not configured', 500)

  let body: any
  try { body = await request.json() } catch { return bad('Invalid JSON body') }

  const eventId = (body.event_id || '').toString().trim()
  const tierId = (body.tier_id || '').toString().trim() || null
  const attendeeName = (body.attendee_name || '').toString().trim()
  const attendeeEmail = (body.attendee_email || '').toString().trim()
  const attendeePhone = (body.attendee_phone || '').toString().trim()
  const quantity = Math.max(1, Math.min(20, parseInt(body.quantity || '1', 10) || 1))
  const paymentConfirmation = (body.payment_confirmation || '').toString().trim()
  const notes = (body.notes || '').toString().trim()

  if (!eventId) return bad('Missing event')
  if (!attendeeName) return bad('Please provide your name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) return bad('Please provide a valid email')

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // Fetch the event + verify RSVP is enabled + not past deadline.
  const { data: event, error: evErr } = await supabase
    .from('events')
    .select('id, title, rsvp_enabled, rsvp_deadline, rsvp_capacity, payment_link, payment_instructions, date, publisher_name')
    .eq('id', eventId)
    .single()
  if (evErr || !event) return bad('Event not found', 404)
  if (!event.rsvp_enabled) return bad('RSVP is not open for this event')
  if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
    return bad('RSVP deadline has passed')
  }

  // Load tier + validate.
  let tier: EventTier | null = null
  if (tierId) {
    const { data: t } = await supabase
      .from('event_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('event_id', eventId)
      .single()
    tier = (t as any) as EventTier
    if (!tier) return bad('Invalid ticket tier')
  } else {
    // If no tier is provided but tiers exist, force user to pick.
    const { data: existing } = await supabase.from('event_tiers').select('id').eq('event_id', eventId).limit(1)
    if (existing?.length) return bad('Please select a ticket tier')
    // No tiers means a free single-tier event — synthesize an implicit tier.
    tier = { id: '', event_id: eventId, name: 'General', price: 0, capacity: null, sort_order: 0 }
  }

  const isPaid = Number(tier.price) > 0
  if (isPaid && !paymentConfirmation) {
    return bad('Please enter your payment confirmation number after paying at the link.')
  }

  // Current occupancy — for waitlist decision.
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
  const currentTierTaken = ((rsvps as EventRsvp[] | null) || [])
    .filter((r) => r.tier_id === tier!.id && (r.status === 'confirmed' || r.status === 'attended' || r.status === 'pending'))
    .reduce((sum, r) => sum + r.quantity, 0)
  const currentEventTaken = ((rsvps as EventRsvp[] | null) || [])
    .filter((r) => r.status === 'confirmed' || r.status === 'attended' || r.status === 'pending')
    .reduce((sum, r) => sum + r.quantity, 0)

  const status = decideRsvpStatus({
    tier,
    quantity,
    paymentConfirmation,
    eventCapacity: event.rsvp_capacity,
    currentTierTaken,
    currentEventTaken,
  })

  const confirmationCode = generateConfirmationCode()

  const { error: insErr } = await supabase.from('event_rsvps').insert({
    event_id: eventId,
    tier_id: tier.id || null,
    attendee_name: attendeeName.substring(0, 200),
    attendee_email: attendeeEmail.substring(0, 200),
    attendee_phone: attendeePhone.substring(0, 40),
    quantity,
    payment_confirmation: paymentConfirmation.substring(0, 200),
    status,
    notes: notes.substring(0, 2000),
    confirmation_code: confirmationCode,
  })
  if (insErr) return bad(`RSVP failed: ${insErr.message}`, 500)

  // Confirmation email (fire-and-forget).
  const statusLine = {
    confirmed: '<strong>Confirmed.</strong> You\'re on the list.',
    pending:   '<strong>Pending.</strong> We received your RSVP but still need your payment confirmation. Reply to this email once paid.',
    waitlist:  '<strong>Waitlist.</strong> The event or your chosen tier is full — we\'ll notify you if a spot opens.',
    cancelled: '<strong>Cancelled.</strong>',
    attended:  '<strong>Checked in.</strong>',
  }[status]
  const html = renderEmail('Your RSVP', `
    <p>Hi ${escapeHtml(attendeeName)},</p>
    <p>${statusLine}</p>
    <p><strong>${escapeHtml(event.title)}</strong><br/>${escapeHtml(event.date)}</p>
    <p>Tier: ${escapeHtml(tier.name)} × ${quantity}${tier.price > 0 ? ` — $${(tier.price * quantity).toFixed(2)}` : ''}</p>
    <p style="background:#f5efe0;padding:12px 16px;border-radius:10px;font-family:ui-monospace,monospace;font-size:16px;letter-spacing:0.08em;text-align:center;">
      Confirmation code: <strong>${confirmationCode}</strong>
    </p>
    <p>Show this code at the door.</p>
  `)
  sendEmail({
    to: attendeeEmail,
    subject: `RSVP ${confirmationCode} — ${event.title}`,
    html,
  }).catch(() => { /* swallow */ })

  return NextResponse.json({
    ok: true,
    confirmation_code: confirmationCode,
    status,
  })
}
