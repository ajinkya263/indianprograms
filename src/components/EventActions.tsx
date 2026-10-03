'use client'

import { motion } from 'framer-motion'
import { CalendarPlus, MapPin, Share2, Check } from 'lucide-react'
import { useState } from 'react'

interface EventActionsProps {
  title: string
  description: string
  date: string                // YYYY-MM-DD
  time?: string               // "3:00 PM" or "15:00"
  venue: string
  city: string
  shortUrl: string
}

/**
 * Build a downloadable .ics file in memory and trigger a click on a synthetic
 * anchor. Works in every modern browser without any backend round-trip.
 */
function downloadIcs(opts: EventActionsProps) {
  const start = parseDateTime(opts.date, opts.time)
  // No reliable end time in our schema — default to 2 hours after start.
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const escape = (s: string) =>
    String(s || '')
      .replace(/[\\,;]/g, (m) => `\\${m}`)
      .replace(/\r?\n/g, '\\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//indianprograms//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${opts.shortUrl}@indianprograms`,
    `DTSTAMP:${fmt(new Date('2026-06-21T00:00:00Z'))}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escape(opts.title)}`,
    `DESCRIPTION:${escape(opts.description)}\\n\\n${opts.shortUrl}`,
    `LOCATION:${escape([opts.venue, opts.city].filter(Boolean).join(', '))}`,
    `URL:${opts.shortUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(opts.title)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function parseDateTime(dateStr: string, timeStr?: string): Date {
  // Default to 7pm local if no time provided.
  let hours = 19
  let minutes = 0
  if (timeStr) {
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/)
    if (m) {
      hours = parseInt(m[1], 10)
      minutes = parseInt(m[2], 10)
      const meridiem = m[3]?.toUpperCase()
      if (meridiem === 'PM' && hours < 12) hours += 12
      if (meridiem === 'AM' && hours === 12) hours = 0
    }
  }
  return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function daysFromToday(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function countdownLabel(dateStr: string): { label: string; tone: 'soon' | 'normal' | 'past' } {
  const days = daysFromToday(dateStr)
  if (days < 0) return { label: 'This event has passed', tone: 'past' }
  if (days === 0) return { label: 'Happening today', tone: 'soon' }
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (days <= 7) return { label: `In ${days} days`, tone: 'soon' }
  if (days <= 30) return { label: `In ${days} days`, tone: 'normal' }
  const weeks = Math.round(days / 7)
  if (days <= 90) return { label: `In ${weeks} weeks`, tone: 'normal' }
  const months = Math.round(days / 30)
  return { label: `In ${months} months`, tone: 'normal' }
}

export default function EventActions(props: EventActionsProps) {
  const [copied, setCopied] = useState(false)
  const countdown = countdownLabel(props.date)
  const mapsQuery = encodeURIComponent([props.venue, props.city].filter(Boolean).join(', '))
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: props.title, url: props.shortUrl })
        return
      } catch {
        // user dismissed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(props.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
          countdown.tone === 'soon'
            ? 'text-saffron border-saffron/40 bg-saffron/10'
            : countdown.tone === 'past'
              ? 'text-gray-500 border-gray-700 bg-gray-900/40'
              : 'text-gray-300 border-[#1A1726] bg-[#0F0D1A]'
        }`}
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {countdown.label}
      </motion.div>

      <button
        type="button"
        onClick={() => downloadIcs(props)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 border border-[#1A1726] hover:text-white hover:border-gray-500 bg-[#0F0D1A] transition-colors"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <CalendarPlus size={13} />
        Add to Calendar
      </button>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 border border-[#1A1726] hover:text-white hover:border-gray-500 bg-[#0F0D1A] transition-colors"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <MapPin size={13} />
        Get Directions
      </a>

      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 border border-[#1A1726] hover:text-white hover:border-gray-500 bg-[#0F0D1A] transition-colors"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
        {copied ? 'Link copied' : 'Share'}
      </button>
    </div>
  )
}
