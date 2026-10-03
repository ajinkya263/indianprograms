import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/constants'
import type { Profile, Event } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EventCard from '@/components/EventCard'
import PublisherProfileClient from '@/components/PublisherProfileClient'

interface PageProps {
  params: { slug: string }
}

function formatJoinedDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export default async function PublisherProfilePage({ params }: PageProps) {
  const { slug } = params
  const supabase = createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile || (profile as Profile).suspended) {
    return notFound()
  }

  const pub = profile as Profile
  const siteUrl = getSiteUrl()
  const profileUrl = `${siteUrl}/p/${pub.slug}`

  // Fetch their published events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('publisher_id', pub.id)
    .eq('status', 'published')
    .order('date', { ascending: true })

  const allEvents = (events || []) as Event[]

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = allEvents.filter(e => e.date >= today)
  const pastEvents = allEvents.filter(e => e.date < today).reverse() // most recent past first

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Publisher Header */}
        <div className="mb-12">
          <div
            className="rounded-2xl border p-8 sm:p-10"
            style={{ backgroundColor: '#0F0D1A', borderColor: '#1A1726' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                {/* Avatar initial */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-black mb-6"
                  style={{ backgroundColor: '#E8970A', fontFamily: 'Playfair Display, serif' }}
                >
                  {pub.name.charAt(0).toUpperCase()}
                </div>

                <h1
                  className="text-3xl sm:text-4xl font-bold text-white mb-2"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pub.name}
                </h1>

                <p
                  className="text-sm text-gray-500 mb-4"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  Joined {formatJoinedDate(pub.joined_at)}
                </p>

                {pub.bio && (
                  <p
                    className="text-gray-300 max-w-2xl leading-relaxed"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {pub.bio}
                  </p>
                )}
              </div>

              {/* Shareable URL */}
              <div className="flex-shrink-0">
                <PublisherProfileClient profileUrl={profileUrl} />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-[#1A1726]">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{upcomingEvents.length}</p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{pastEvents.length}</p>
                <p className="text-xs text-gray-500">Past</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{allEvents.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Calendar size={20} style={{ color: '#E8970A' }} />
            <h2
              className="text-2xl font-semibold text-white"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Upcoming Events
            </h2>
            {upcomingEvents.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8970A]/20 text-[#E8970A]">
                {upcomingEvents.length}
              </span>
            )}
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 bg-[#0F0D1A] border border-[#1A1726] rounded-xl">
              <p className="text-gray-500" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                No upcoming events scheduled.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        {pastEvents.length > 0 && (
          <>
            <div className="flex items-center gap-4 my-10">
              <div className="flex-1 h-px bg-[#1A1726]" />
              <span className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Past Events
              </span>
              <div className="flex-1 h-px bg-[#1A1726]" />
            </div>

            {/* Past Events */}
            <div className="mb-12 opacity-70">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
