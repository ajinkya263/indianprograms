/**
 * Guest event submission endpoint.
 *
 * Unauthenticated visitors can submit events without registering — this
 * route accepts the form payload, validates it, and inserts a row using
 * the service-role key (which bypasses RLS). The stored row is always
 * status='pending' so it lands in the admin queue for approval.
 *
 * The alternative would be a permissive RLS policy for anon inserts;
 * we prefer server-side control here so we can add rate limiting,
 * spam heuristics, and validation without a schema migration.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateGuestEditToken } from '@/lib/rsvp'
import { sendEmail, renderEmail, escapeHtml } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
// Fall back to the crawler user account — it already exists as a system
// publisher and its rows are the crawler's, so guest submissions living
// under the same id are OK for now. If we later want a distinct "Guest
// Submissions" account, set GUEST_USER_ID in env and it wins.
const GUEST_USER_ID = process.env.GUEST_USER_ID || process.env.CRAWLER_USER_ID

const ALLOWED_CATEGORIES = new Set([
  'festival', 'dance', 'vocal', 'instrumental', 'movies',
  'competition', 'standup', 'play', 'poetry',
])

const ALLOWED_LANGUAGES = new Set([
  'Hindi','Marathi','Gujarati','Tamil','Telugu','Bengali','Punjabi',
  'Kannada','Malayalam','Urdu','Sanskrit','Odia','Assamese','Konkani',
  'Sindhi','Kashmiri','Rajasthani','Bhojpuri','Multilingual','English',
])

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE) return bad('Server not configured', 500)
  if (!GUEST_USER_ID) return bad('Guest publisher not configured', 500)

  let body: any
  try {
    body = await request.json()
  } catch {
    return bad('Invalid JSON body')
  }

  // Minimum viable submission — everything else has a sensible default.
  const title = (body.title || '').toString().trim()
  const date = (body.date || '').toString().trim()
  const category = (body.category || '').toString().trim().toLowerCase()
  const guestName = (body.guestName || '').toString().trim()
  const guestEmail = (body.guestEmail || '').toString().trim()

  if (title.length < 3) return bad('Title is too short')
  if (title.length > 500) return bad('Title is too long')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad('Invalid date — expected YYYY-MM-DD')
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return bad('Invalid date')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const twoYearsOut = new Date(); twoYearsOut.setFullYear(twoYearsOut.getFullYear() + 2)
  if (d < today) return bad('Event date is in the past')
  if (d > twoYearsOut) return bad('Event date is too far in the future')
  if (!ALLOWED_CATEGORIES.has(category)) return bad('Invalid category')
  const language = (body.language || '').toString().trim()
  if (!language) return bad('Please pick the event language')
  if (!ALLOWED_LANGUAGES.has(language)) return bad('Invalid language')
  if (!guestName) return bad('Please provide your name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) return bad('Please provide a valid email')

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  // Mint a magic-link secret so the guest can manage the event
  // (and RSVPs, if enabled) later without an account.
  const guestEditToken = generateGuestEditToken()

  const rsvpEnabled = !!body.rsvp_enabled
  const rsvpDeadline = rsvpEnabled && body.rsvp_deadline ? String(body.rsvp_deadline) : null
  const rsvpCapacity = rsvpEnabled && body.rsvp_capacity ? Math.max(1, parseInt(body.rsvp_capacity, 10) || 1) : null
  const paymentLink = String(body.payment_link || '').substring(0, 1000)
  const paymentInstructions = String(body.payment_instructions || '').substring(0, 5000)

  const insert: any = {
    title: title.substring(0, 500),
    category,
    description: (body.description || '').toString().substring(0, 5000),
    venue: (body.venue || '').toString().substring(0, 500),
    address: (body.address || '').toString().substring(0, 500),
    city: (body.city || '').toString().substring(0, 100),
    metro_region: (body.metro_region || '').toString().substring(0, 100),
    state: (body.state || '').toString().substring(0, 100),
    zip_code: (body.zip_code || '').toString().substring(0, 20),
    date,
    time: (body.time || '').toString().substring(0, 50),
    ticket_url: (body.ticket_url || '').toString().substring(0, 1000),
    price: body.price === 'Paid' ? 'Paid' : 'Free',
    language,
    image_url: (body.image_url || '').toString().substring(0, 1000),
    status: 'pending',        // Always pending — admin approves.
    source: 'manual',
    publisher_id: GUEST_USER_ID,
    publisher_name: guestName.substring(0, 200),
    submitter_email: guestEmail.substring(0, 200),
    rsvp_enabled: rsvpEnabled,
    rsvp_deadline: rsvpDeadline,
    rsvp_capacity: rsvpCapacity,
    payment_link: paymentLink,
    payment_instructions: paymentInstructions,
    guest_edit_token: guestEditToken,
  }

  const { data: inserted, error } = await supabase.from('events').insert(insert).select('id').single()
  if (error || !inserted) return bad(`Insert failed: ${error?.message || 'unknown'}`, 500)

  // Persist tiers, if any were supplied.
  const tiers = Array.isArray(body.tiers) ? body.tiers : []
  if (rsvpEnabled && tiers.length > 0) {
    const tierRows = tiers.slice(0, 20).map((t: any, i: number) => ({
      event_id: inserted.id,
      name: String(t.name || '').substring(0, 200),
      price: Math.max(0, Number(t.price) || 0),
      capacity: t.capacity == null || t.capacity === '' ? null : Math.max(1, parseInt(t.capacity, 10) || 1),
      sort_order: i,
    })).filter((t: any) => t.name)
    if (tierRows.length) {
      const { error: tierErr } = await supabase.from('event_tiers').insert(tierRows)
      if (tierErr) console.warn('[submit-guest] tiers insert failed', tierErr.message)
    }
  }

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host') || 'indianprograms.com'
  const editUrl = `${proto}://${host}/g/${guestEditToken}`

  // Email the guest their management link (fire-and-forget).
  const html = renderEmail('Your submission is in the queue', `
    <p>Hi ${escapeHtml(guestName)},</p>
    <p>Thanks for submitting <strong>${escapeHtml(title)}</strong> to IndianPrograms. Our admins will review it and, if approved, it will appear on the site.</p>
    <p>You can manage your event${rsvpEnabled ? ' and see RSVPs' : ''} at this link — <strong>save it, it\'s the only way back in without an account</strong>:</p>
    <p style="background:#f5efe0;padding:10px 14px;border-radius:8px;font-family:ui-monospace,monospace;font-size:13px;word-break:break-all;">
      <a href="${escapeHtml(editUrl)}" style="color:#A0522D;text-decoration:none;">${escapeHtml(editUrl)}</a>
    </p>
    <p style="font-size:13px;color:#7b6c55;">If you didn\'t submit this event, ignore this email.</p>
  `)
  sendEmail({ to: guestEmail, subject: `Your event submission — ${title}`, html }).catch(() => { /* swallow */ })

  return NextResponse.json({ ok: true, edit_url: editUrl })
}
