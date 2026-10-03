/**
 * Shared RSVP / ticketing helpers.
 *
 * The RSVP system is a lightweight ticketing layer with no payment
 * processing. Publishers publish their own external payment link and
 * attendees paste a confirmation number back into the RSVP form.
 * Everything here is pure — no side effects — so it's safe to import
 * from both browser and server code.
 */

/** Row shape of `event_tiers`. */
export interface EventTier {
  id: string
  event_id: string
  name: string
  price: number
  capacity: number | null
  sort_order: number
  created_at?: string
}

/** Row shape of `event_rsvps`. */
export interface EventRsvp {
  id: string
  event_id: string
  tier_id: string | null
  attendee_name: string
  attendee_email: string
  attendee_phone: string
  quantity: number
  payment_confirmation: string
  status: RsvpStatus
  notes: string
  confirmation_code: string
  checked_in_at: string | null
  created_at: string
}

export type RsvpStatus =
  | 'pending'      // paid tier, no confirmation number supplied yet
  | 'confirmed'    // accepted (free tier, or paid tier + confirmation)
  | 'waitlist'     // capacity full — will promote if a slot opens
  | 'cancelled'    // attendee or publisher cancelled
  | 'attended'     // checked in at the door

/**
 * Generate a URL-safe, 43-character random token (32 random bytes,
 * base64url-encoded). Used for the guest publisher's magic link.
 *
 * Uses Web Crypto (available in Node 20+ and modern browsers). Falls
 * back to a coarser Math.random loop only if crypto is missing — that
 * path should never fire in prod.
 */
export function generateGuestEditToken(): string {
  const bytes = new Uint8Array(32)
  const g: any = globalThis as any
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytesToBase64Url(bytes)
}

/**
 * Short attendee-facing confirmation code, ~8 chars. Uppercase letters
 * and digits, excluding characters that read the same in a phone
 * screenshot (0/O, 1/I). Not a security token — just a reference the
 * attendee shows at the door.
 */
export function generateConfirmationCode(): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(8)
  const g: any = globalThis as any
  if (g.crypto?.getRandomValues) g.crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  let out = ''
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  // btoa is available in browsers and Node 16+. In Node we could also
  // Buffer.from(bytes).toString('base64url') — this path works in both.
  const b64 = (globalThis as any).btoa
    ? (globalThis as any).btoa(bin)
    : Buffer.from(bytes).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Aggregate RSVP counts used by dashboards. Pure function so the same
 * computation happens on the server (for API responses) and the browser
 * (for optimistic UI updates).
 */
export interface RsvpAggregates {
  total: number
  confirmed: number
  pending: number
  waitlist: number
  cancelled: number
  attended: number
  seatsConfirmed: number        // sum(quantity) of confirmed + attended
  reportedRevenue: number       // sum(quantity * tier.price) of confirmed + attended
}

export function aggregateRsvps(rsvps: EventRsvp[], tiers: EventTier[]): RsvpAggregates {
  const tierPrice = new Map<string, number>()
  for (const t of tiers) tierPrice.set(t.id, Number(t.price) || 0)

  const agg: RsvpAggregates = {
    total: rsvps.length,
    confirmed: 0,
    pending: 0,
    waitlist: 0,
    cancelled: 0,
    attended: 0,
    seatsConfirmed: 0,
    reportedRevenue: 0,
  }
  for (const r of rsvps) {
    agg[r.status]++
    if (r.status === 'confirmed' || r.status === 'attended') {
      agg.seatsConfirmed += r.quantity
      const price = (r.tier_id && tierPrice.get(r.tier_id)) || 0
      agg.reportedRevenue += r.quantity * price
    }
  }
  return agg
}

/**
 * Per-tier occupancy — used to render the "18/50 sold" chips on the
 * dashboard and to decide whether an incoming RSVP is confirmed or
 * bumped to the waitlist.
 */
export interface TierOccupancy {
  tier: EventTier
  seatsTaken: number
  seatsLeft: number | null     // null when tier is uncapped
  waitlistCount: number
}

export function computeTierOccupancy(tiers: EventTier[], rsvps: EventRsvp[]): TierOccupancy[] {
  return tiers.map((tier) => {
    let taken = 0
    let waitlist = 0
    for (const r of rsvps) {
      if (r.tier_id !== tier.id) continue
      if (r.status === 'confirmed' || r.status === 'attended' || r.status === 'pending') {
        taken += r.quantity
      } else if (r.status === 'waitlist') {
        waitlist += r.quantity
      }
    }
    const seatsLeft = tier.capacity == null ? null : Math.max(0, tier.capacity - taken)
    return { tier, seatsTaken: taken, seatsLeft, waitlistCount: waitlist }
  })
}

/**
 * Decide the status a new RSVP should take.
 *
 * Rules (in order):
 *   1. If the tier is at capacity → waitlist.
 *   2. If the event has an overall cap and it's reached → waitlist.
 *   3. If the tier price > 0 and no payment_confirmation supplied → pending.
 *   4. Otherwise → confirmed.
 */
export function decideRsvpStatus(input: {
  tier: EventTier
  quantity: number
  paymentConfirmation: string
  eventCapacity: number | null
  currentTierTaken: number
  currentEventTaken: number
}): RsvpStatus {
  const nextTierTaken = input.currentTierTaken + input.quantity
  if (input.tier.capacity != null && nextTierTaken > input.tier.capacity) return 'waitlist'
  if (input.eventCapacity != null && input.currentEventTaken + input.quantity > input.eventCapacity) {
    return 'waitlist'
  }
  const isPaid = Number(input.tier.price) > 0
  if (isPaid && !input.paymentConfirmation.trim()) return 'pending'
  return 'confirmed'
}

/**
 * When a confirmed / attended row is cancelled and the tier was at
 * capacity, promote the oldest waitlist row for that tier if any.
 * Returns the id to promote (caller updates the DB) or null.
 */
export function pickWaitlistPromotion(
  tier: EventTier,
  rsvps: EventRsvp[],
): string | null {
  if (tier.capacity == null) return null
  const oldestWaitlist = rsvps
    .filter((r) => r.tier_id === tier.id && r.status === 'waitlist')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
  return oldestWaitlist ? oldestWaitlist.id : null
}
