/**
 * Resolves the right ticket URL + label for an event.
 *
 * Background: not every event has a direct buy/RSVP link. Some listing pages
 * gate ticketing behind sign-in, so pointing "Get Tickets" straight at them
 * sends users to a dead end. Instead we synthesize a targeted Google search
 * URL ("<title> <venue> <city> tickets") which is the most reliable way to land
 * on whichever platform actually sells tickets for that event.
 */

const KNOWN_TICKET_DOMAINS = [
  'bookmyshow.com',
  'in.bookmyshow.com',
  'insider.in',
  'paytminsider.com',
  'eventbrite.com',
  'eventbrite.in',
  'ticketmaster.com',
  'seatgeek.com',
  'meetup.com',
  'allevents.in',
  'sulekha.com',
  'tugoz.com',
  'rsvpify.com',
  'showclix.com',
  'universe.com',
  'dice.fm',
]

// Listing pages that don't actually let you buy tickets and should be
// treated like "no direct link" — the page is a listing, not a ticketing flow.
const LISTING_ONLY_DOMAINS = [
  'jalsa.world',
  'kala.social',
]

function getHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function isDirectTicketUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const host = getHost(url)
  if (!host) return false
  if (LISTING_ONLY_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return false
  return KNOWN_TICKET_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

export function buildSearchTicketUrl(opts: {
  title: string
  city?: string
  venue?: string
}): string {
  const parts = [opts.title, opts.venue, opts.city, 'tickets']
    .map((s) => (s || '').trim())
    .filter(Boolean)
  const q = parts.join(' ').replace(/\s+/g, ' ').trim()
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

export type TicketAction = {
  url: string
  /** 'direct' = a real buy/RSVP page; 'search' = a Google search fallback. */
  kind: 'direct' | 'search'
  label: string
}

export function resolveTicketAction(event: {
  title: string
  city?: string
  venue?: string
  ticket_url?: string | null
}): TicketAction | null {
  if (isDirectTicketUrl(event.ticket_url)) {
    return { url: event.ticket_url as string, kind: 'direct', label: 'Get Tickets' }
  }
  if (!event.title) return null
  return {
    url: buildSearchTicketUrl(event),
    kind: 'search',
    label: 'Find Tickets',
  }
}
