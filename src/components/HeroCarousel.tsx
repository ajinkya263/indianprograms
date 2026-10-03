'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event } from '@/lib/types'

interface HeroCarouselProps {
  events: Event[]
}

export default function HeroCarousel({ events }: HeroCarouselProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (events.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % events.length)
    }, 5000)
    return () => clearInterval(id)
  }, [events.length])

  if (!events || events.length === 0) return null

  const prev = () => setIndex((i) => (i - 1 + events.length) % events.length)
  const next = () => setIndex((i) => (i + 1) % events.length)

  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }

  return (
    <div className="relative w-full overflow-hidden h-[250px] sm:h-[320px] md:h-[400px]">
      {events.map((event, i) => (
        <div
          key={event.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image_url}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
              <div className="max-w-2xl">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 leading-tight"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {event.title}
                </h2>
                <p
                  className="text-gray-200 text-base sm:text-lg mb-1"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {formatDate(event.date)}
                  {event.time ? ` • ${event.time}` : ''}
                </p>
                <p
                  className="text-gray-300 text-sm sm:text-base mb-5"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {event.venue}
                  {event.city ? `, ${event.city}` : ''}
                </p>
                <Link
                  href={`/events/${event.id}`}
                  className="inline-block px-6 py-3 rounded-lg bg-saffron text-black font-semibold hover:bg-saffron/90 transition-colors"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {events.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-8 bg-saffron' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
