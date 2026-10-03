import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Event } from '@/lib/types'

interface PageProps {
  params: { slug: string }
}

export default async function PublicBioPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  const { data: bioPage } = await supabase
    .from('bio_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!bioPage) return notFound()

  // Increment view count (fire and forget)
  supabase.from('bio_pages').update({ view_count: bioPage.view_count + 1 }).eq('id', bioPage.id).then(() => {})

  const { data: links } = await supabase
    .from('bio_links')
    .select('*')
    .eq('bio_page_id', bioPage.id)
    .eq('is_active', true)
    .order('position')

  // Fetch upcoming events for this user if show_events is enabled
  let events: Event[] = []
  if (bioPage.show_events) {
    const today = new Date().toISOString().split('T')[0]
    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('publisher_id', bioPage.user_id)
      .eq('status', 'published')
      .gte('date', today)
      .order('date')
      .limit(5)
    events = (ev || []) as Event[]
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ backgroundColor: bioPage.background_color, color: bioPage.text_color, fontFamily: 'DM Sans, sans-serif' }}
    >
      <div className="w-full max-w-md text-center space-y-6">
        {bioPage.avatar_url && (
          <img src={bioPage.avatar_url} alt={bioPage.title} className="w-24 h-24 rounded-full mx-auto object-cover border-4" style={{ borderColor: bioPage.button_color }} />
        )}

        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{bioPage.title}</h1>
          {bioPage.bio && <p className="mt-2 opacity-80 text-sm">{bioPage.bio}</p>}
        </div>

        {/* Links */}
        {links && links.length > 0 && (
          <div className="space-y-3">
            {links.map((link: any) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-5 py-4 rounded-xl font-semibold hover:scale-[1.02] transition-transform shadow-lg"
                style={{ backgroundColor: bioPage.button_color, color: '#000000' }}
              >
                <div>{link.title}</div>
                {link.description && <div className="text-xs opacity-70 font-normal mt-1">{link.description}</div>}
              </a>
            ))}
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="pt-6">
            <h2 className="text-lg font-semibold mb-3 opacity-90" style={{ fontFamily: 'Playfair Display, serif' }}>Upcoming Events</h2>
            <div className="space-y-3">
              {events.map((ev) => (
                <a
                  key={ev.id}
                  href={`/e/${ev.id.replace(/-/g, '').substring(0, 7)}`}
                  className="block px-4 py-3 rounded-xl border text-left"
                  style={{ borderColor: bioPage.button_color }}
                >
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs opacity-80 mt-1">{ev.date} · {ev.city}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="pt-8 text-xs opacity-50">
          Powered by <a href="/" className="underline">IndianPrograms</a>
        </div>
      </div>
    </div>
  )
}
