'use client'

import { motion } from 'framer-motion'
import { MapPin, Calendar, Clock } from 'lucide-react'
import { getCategoryMeta, getShortId } from '@/lib/constants'
import { formatTime } from '@/lib/formatTime'
import type { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
  index?: number
  /** Additional dates for the same recurring event; when set, the card
      shows a small "+N more dates" chip next to the primary date. */
  extraDates?: string[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EventCard({ event, index = 0, extraDates = [] }: EventCardProps) {
  const category = getCategoryMeta(event.category)
  const shortId = getShortId(event.id)
  const nExtra = extraDates.length

  return (
    <motion.a
      href={`/e/${shortId}`}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070510] rounded-2xl"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.04, 0.32),
      }}
      whileHover={{ y: -6 }}
    >
      <div
        className="relative h-full flex flex-col rounded-2xl overflow-hidden border bg-[#0F0D1A] border-[#1A1726] transition-[border-color,box-shadow] duration-300 group-hover:border-[#E8970A]/40 shadow-[0_1px_2px_rgba(0,0,0,0.4)] group-hover:shadow-[0_18px_40px_-12px_rgba(232,151,10,0.35)]"
      >
        {/* Image area — fixed height so cards stay uniform. */}
        <div className="relative h-48 w-full overflow-hidden bg-[#0A0814] flex-shrink-0">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.08]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20`} />
              <span className="text-5xl relative z-10">{category.emoji}</span>
              <span
                className="text-xs text-gray-400 mt-2 relative z-10"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {category.label}
              </span>
            </div>
          )}

          {/* Bottom-of-image gradient — keeps badges legible over busy posters */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Category badge */}
          <div className="absolute top-3 left-3 z-20">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-white bg-gradient-to-r ${category.gradient} shadow-md shadow-black/30 backdrop-blur-[2px]`}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {category.emoji} {category.label}
            </span>
          </div>

          {/* Price badge */}
          <div className="absolute top-3 right-3 z-20">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md shadow-black/30 ${
                event.price === 'Free' ? 'bg-emerald-500/95 text-white' : 'text-black'
              }`}
              style={{
                ...(event.price === 'Paid' ? { backgroundColor: '#E8970A' } : undefined),
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {event.price}
            </span>
          </div>
        </div>

        {/* Content — flex-1 so short titles don't collapse the card. */}
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <h3
            className="text-lg font-semibold text-white line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-[#E8970A] min-h-[3.25rem]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {event.title}
          </h3>

          <div
            className="space-y-1.5 text-sm text-gray-400"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar size={14} className="text-gray-500 flex-shrink-0" />
              <span>{formatDate(event.date)}</span>
              {nExtra > 0 && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--accent)',
                    backgroundColor: 'var(--accent-soft)',
                  }}
                  title={extraDates.map(formatDate).join(' · ')}
                >
                  +{nExtra} more {nExtra === 1 ? 'date' : 'dates'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500 flex-shrink-0" />
              <span>{formatTime(event.time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {event.venue}
                {event.venue && event.city ? ', ' : ''}
                {event.city}
              </span>
            </div>
          </div>
        </div>

        {/* Hover accent underline — slides in from the left */}
        <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-gradient-to-r from-[#E8970A] via-[#FFD700] to-[#E8970A] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      </div>
    </motion.a>
  )
}
