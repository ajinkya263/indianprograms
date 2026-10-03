'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event } from '@/lib/types'
import EventCard from './EventCard'

interface EventCarouselProps {
  title: string
  events: Event[]
  viewAllHref?: string
}

const CARD_WIDTH = 320

export default function EventCarousel({ title, events, viewAllHref }: EventCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  if (!events || events.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollerRef.current
    if (!el) return
    const delta = (CARD_WIDTH + 16) * (dir === 'left' ? -1 : 1)
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-semibold text-white flex items-center gap-3"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          <span className="w-1.5 h-6 bg-saffron rounded-full inline-block" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm text-saffron hover:text-saffron/80 font-medium mr-2"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              View All
            </Link>
          )}
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="snap-start flex-shrink-0"
            style={{ width: `${CARD_WIDTH}px` }}
          >
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  )
}
