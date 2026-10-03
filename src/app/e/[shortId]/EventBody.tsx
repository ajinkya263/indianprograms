'use client'

/**
 * Client-side layout switcher for the event detail page.
 * V1 = current layout (preserved verbatim).
 * V2 = magazine — poster + sticky right-column "event info" card holding
 *      every CTA.
 * V3 = ticket stub — poster hero with title/date overlaid, quick-facts
 *      chip strip, one prominent CTA, vertical stack below.
 *
 * User's pick persists in localStorage. Every layout uses the same event
 * data — flipping between them keeps the URL, event, and any state.
 */
import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, User, Ticket } from 'lucide-react'
import type { Event } from '@/lib/types'
import { getCategoryMeta } from '@/lib/constants'
import EventDetailClient from '@/components/EventDetailClient'
import EventPoster from '@/components/EventPoster'
import EventActions from '@/components/EventActions'
import { resolveTicketAction } from '@/lib/ticketUrl'
import { formatTime } from '@/lib/formatTime'

interface Props {
  event: Event
  shortId: string
  shortUrl: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function EventBody({ event, shortId, shortUrl }: Props) {
  const [layout, setLayout] = useState<'v1' | 'v2' | 'v3'>('v1')
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eventDetailLayout') as 'v1' | 'v2' | 'v3' | null
      if (stored === 'v1' || stored === 'v2' || stored === 'v3') setLayout(stored)
    } catch { /* private mode */ }
  }, [])
  function pick(v: 'v1' | 'v2' | 'v3') {
    setLayout(v)
    try { localStorage.setItem('eventDetailLayout', v) } catch { /* noop */ }
  }

  const category = getCategoryMeta(event.category)
  const rsvpActive = (event as any).rsvp_enabled && (
    !(event as any).rsvp_deadline || new Date((event as any).rsvp_deadline) > new Date()
  )
  const rawTicketAction = resolveTicketAction({
    title: event.title,
    city: event.city,
    venue: event.venue,
    ticket_url: event.ticket_url,
  })
  // Hide the "search the web" fallback for RSVP events — RSVP is the primary CTA
  const ticketAction = ((event as any).rsvp_enabled && rawTicketAction?.kind === 'search') ? null : rawTicketAction
  const locationParts = [event.venue, event.address, event.city, event.state, event.zip_code]
    .map((s) => (s || '').trim())
    .filter(Boolean)
  const locationQuery = locationParts.join(', ')
  const mapEncoded = encodeURIComponent(locationQuery)

  return (
    <V1Layout
      event={event}
      shortId={shortId}
      shortUrl={shortUrl}
      category={category}
      ticketAction={ticketAction}
      rsvpActive={rsvpActive}
      locationQuery={locationQuery}
      mapEncoded={mapEncoded}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────
// V1 — current layout preserved verbatim
// ────────────────────────────────────────────────────────────────────────

interface LayoutProps {
  event: Event
  shortId: string
  shortUrl: string
  category: ReturnType<typeof getCategoryMeta>
  ticketAction: ReturnType<typeof resolveTicketAction>
  rsvpActive: boolean
  locationQuery: string
  mapEncoded: string
}

function V1Layout({ event, shortId, shortUrl, category, ticketAction, rsvpActive, locationQuery, mapEncoded }: LayoutProps) {
  return (
    <>
      {/* Category Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${category.gradient}`}
        >
          {category.emoji} {category.label}
        </span>
      </div>

      {/* Title */}
      <h1
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {event.title}
      </h1>

      {/* Inline actions */}
      <div className="mb-6">
        <EventActions
          title={event.title}
          description={event.description}
          date={event.date}
          time={event.time}
          venue={event.venue}
          city={event.city}
          shortUrl={shortUrl}
        />
      </div>

      {rsvpActive && (
        <div className="mb-8 rounded-xl border p-4 bg-[#0F0D1A] border-[#1A1726] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              RSVP for this event
            </div>
            <div className="text-xs text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Register your seat now
              {(event as any).rsvp_deadline
                ? ` — deadline ${new Date((event as any).rsvp_deadline).toLocaleString()}`
                : ''}
            </div>
          </div>
          <a
            href={`/e/${shortId}/rsvp`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black bg-saffron hover:opacity-90 flex-shrink-0"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            🎫 RSVP now
          </a>
        </div>
      )}

      {/* Poster */}
      {event.image_url ? (
        <EventPoster src={event.image_url} alt={event.title} />
      ) : (
        <div className="mb-8 rounded-2xl overflow-hidden relative flex items-center justify-center" style={{ height: '250px' }}>
          <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-15`} />
          <span className="text-7xl relative z-10">{category.emoji}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border p-6 space-y-4 bg-[#0F0D1A] border-[#1A1726]">
            <div className="flex items-center gap-3">
              <Calendar size={20} style={{ color: 'var(--accent)' }} />
              <span className="text-white text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {formatDate(event.date)}
              </span>
            </div>
            {event.time && (
              <div className="flex items-center gap-3">
                <Clock size={20} style={{ color: 'var(--accent)' }} />
                <span className="text-white text-lg" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {formatTime(event.time)}
                </span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin size={20} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <div style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {event.venue && <div className="text-white text-lg font-medium">{event.venue}</div>}
                {event.address && <div className="text-gray-300 text-base">{event.address}</div>}
                <div className="text-gray-300 text-base">
                  {[event.city, event.state, event.zip_code].filter(Boolean).join(', ')}
                </div>
                {event.metro_region && event.metro_region !== event.city && (
                  <div className="text-gray-500 text-sm mt-1">Metro: {event.metro_region}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={20} style={{ color: 'var(--accent)' }} />
              <span className="text-gray-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Published by{' '}
                <span className="text-white font-medium">{event.publisher_name}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                event.price === 'Free' ? 'bg-emerald-500/90 text-white' : 'text-black'
              }`}
              style={event.price === 'Paid' ? { backgroundColor: '#E8970A' } : undefined}
            >
              {event.price === 'Free' ? 'Free Event' : 'Paid Event'}
            </span>
          </div>


        </div>

        <div className="md:col-span-1">
          <EventDetailClient shortUrl={shortUrl} ticketAction={ticketAction} />
        </div>
      </div>

      {/* About — full width below the grid */}
      {event.description && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            About This Event
          </h2>
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {event.description}
          </div>
        </div>
      )}

      {/* Full-width location map below the grid */}
      {locationQuery && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Location
          </h2>
          <div className="rounded-xl overflow-hidden border bg-[#0F0D1A] border-[#1A1726]">
            <iframe
              title={`Map — ${event.venue || event.city || 'event location'}`}
              src={`https://maps.google.com/maps?q=${mapEncoded}&z=14&output=embed`}
              className="w-full h-[420px] sm:h-[500px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-3 border-t border-[#1A1726] flex items-center justify-between gap-3">
              <span className="text-sm text-gray-300 truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {locationQuery}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapEncoded}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <MapPin size={12} />
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────
// V2 — magazine layout with sticky sidebar
// ────────────────────────────────────────────────────────────────────────

function V2Layout({ event, shortId, shortUrl, category, ticketAction, rsvpActive, locationQuery, mapEncoded }: LayoutProps) {
  return (
    <>
      {/* Header: badge + title only */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${category.gradient}`}
        >
          {category.emoji} {category.label}
        </span>
      </div>
      <h1
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {event.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-10">
        {/* Left column — poster, about, location */}
        <div className="space-y-8 min-w-0">
          {event.image_url ? (
            <EventPoster src={event.image_url} alt={event.title} />
          ) : (
            <div className="rounded-2xl overflow-hidden relative flex items-center justify-center" style={{ height: '360px' }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-15`} />
              <span className="text-8xl relative z-10">{category.emoji}</span>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              About This Event
            </h2>
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {event.description}
            </div>
          </div>

        </div>

        {/* Right column — event info + CTAs stacked in one card */}
        <div>
          <div className="space-y-4">
            <div className="rounded-xl border p-5 space-y-4 bg-[#0F0D1A] border-[#1A1726]">
              <div className="text-[11px] uppercase tracking-wider text-gray-500 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Event details
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div className="text-white text-sm leading-snug" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {formatDate(event.date)}
                  {event.time && <div className="text-gray-400 text-xs mt-0.5">{formatTime(event.time)}</div>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                <div className="text-sm leading-snug" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {event.venue && <div className="text-white font-medium">{event.venue}</div>}
                  {event.address && <div className="text-gray-400 text-xs">{event.address}</div>}
                  <div className="text-gray-400 text-xs">
                    {[event.city, event.state, event.zip_code].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#1A1726]">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    event.price === 'Free' ? 'bg-emerald-500/90 text-white' : 'text-black'
                  }`}
                  style={event.price === 'Paid' ? { backgroundColor: '#E8970A' } : undefined}
                >
                  {event.price === 'Free' ? 'Free Event' : 'Paid Event'}
                </span>
              </div>
            </div>

            {/* CTAs stacked in the sidebar */}
            {rsvpActive && (
              <a
                href={`/e/${shortId}/rsvp`}
                className="block w-full text-center py-3 rounded-lg text-sm font-semibold text-black bg-saffron hover:opacity-90"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                🎫 RSVP for this event
              </a>
            )}
            <EventDetailClient shortUrl={shortUrl} ticketAction={ticketAction} />
            <EventActions
              title={event.title}
              description={event.description}
              date={event.date}
              time={event.time}
              venue={event.venue}
              city={event.city}
              shortUrl={shortUrl}
            />
            <div className="text-xs text-gray-500 text-center pt-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Published by <span className="text-gray-400">{event.publisher_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width location map — spans both columns, taller than the
          in-column version so it reads as a proper wayfinding surface. */}
      {locationQuery && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Location
          </h2>
          <div className="rounded-xl overflow-hidden border bg-[#0F0D1A] border-[#1A1726]">
            <iframe
              title={`Map — ${event.venue || event.city || 'event location'}`}
              src={`https://maps.google.com/maps?q=${mapEncoded}&z=14&output=embed`}
              className="w-full h-[420px] sm:h-[500px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-3 border-t border-[#1A1726] flex items-center justify-between gap-3">
              <span className="text-sm text-gray-300 truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {locationQuery}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapEncoded}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <MapPin size={12} />
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────
// V3 — ticket-stub layout
// ────────────────────────────────────────────────────────────────────────

function V3Layout({ event, shortId, shortUrl, category, ticketAction, rsvpActive, locationQuery, mapEncoded }: LayoutProps) {
  return (
    <>
      {/* Poster hero with overlay */}
      <div className="relative rounded-2xl overflow-hidden mb-6" style={{ minHeight: '400px' }}>
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            style={{ maxHeight: '520px' }}
          />
        ) : (
          <div className="w-full flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-40`} />
            <span className="text-9xl relative z-10">{category.emoji}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-6 sm:p-8 pt-16">
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${category.gradient}`}
            >
              {category.emoji} {category.label}
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {event.title}
          </h1>
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-200"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {formatDateShort(event.date)}</span>
            {event.time && <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatTime(event.time)}</span>}
            {event.venue && <span className="inline-flex items-center gap-1.5 max-w-full truncate"><MapPin size={13} /> {event.venue}</span>}
          </div>
        </div>
      </div>

      {/* Primary CTA row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {ticketAction && (
          <a
            href={ticketAction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold text-black bg-saffron hover:opacity-90"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <Ticket size={18} />
            {ticketAction.label}
          </a>
        )}
        {rsvpActive && (
          <a
            href={`/e/${shortId}/rsvp`}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold border-2"
            style={{
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            🎫 RSVP
          </a>
        )}
      </div>

      {/* Secondary actions strip */}
      <div className="mb-8">
        <EventActions
          title={event.title}
          description={event.description}
          date={event.date}
          time={event.time}
          venue={event.venue}
          city={event.city}
          shortUrl={shortUrl}
        />
      </div>

      {/* About */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          About This Event
        </h2>
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {event.description}
        </div>
      </div>

      {/* Where */}
      {locationQuery && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Where
          </h2>
          <div className="rounded-xl border bg-[#0F0D1A] border-[#1A1726] p-5 mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {event.venue && <div className="text-white text-lg font-medium">{event.venue}</div>}
            {event.address && <div className="text-gray-300">{event.address}</div>}
            <div className="text-gray-300">{[event.city, event.state, event.zip_code].filter(Boolean).join(', ')}</div>
          </div>
          <div className="rounded-xl overflow-hidden border bg-[#0F0D1A] border-[#1A1726]">
            <iframe
              title={`Map — ${event.venue || event.city || 'event location'}`}
              src={`https://maps.google.com/maps?q=${mapEncoded}&z=14&output=embed`}
              className="w-full h-72 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-3 border-t border-[#1A1726] flex items-center justify-end">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapEncoded}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <MapPin size={12} />
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer: publisher + QR */}
      <div className="rounded-xl border bg-[#0F0D1A] border-[#1A1726] p-5 mb-4">
        <EventDetailClient shortUrl={shortUrl} ticketAction={ticketAction} />
        <div className="text-xs text-gray-500 text-center mt-4 pt-4 border-t border-[#1A1726]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Published by <span className="text-gray-400">{event.publisher_name}</span>
        </div>
      </div>
    </>
  )
}
