'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { Target, Calendar, Sparkles, ArrowRight, Check } from 'lucide-react'

const PATTERNS = [
  { key: 'standard', label: 'Standard Campaign', days: [30, 14, 7, 3, 1, 0, -1], desc: '30, 14, 7, 3, 1 days + day-of + thank you' },
  { key: 'quick', label: 'Quick Hype', days: [7, 3, 1, 0], desc: '7, 3, 1 days + day-of' },
  { key: 'long', label: 'Long Buildup', days: [60, 30, 14, 7, 3, 1, 0], desc: '60, 30, 14, 7, 3, 1 days + day-of' },
  { key: 'minimal', label: 'Minimal', days: [3, 1, 0], desc: '3, 1 days + day-of' },
]

const PLATFORMS = ['facebook', 'instagram', 'twitter', 'threads', 'linkedin']

export default function CountdownPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0])
  const [customDays, setCustomDays] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState<Array<{ daysOut: number; content: string }>>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram'])
  const [postTime, setPostTime] = useState('09:00')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      let q = supabase.from('events').select('*').eq('status', 'published').gte('date', new Date().toISOString().split('T')[0]).order('date')
      if (profile?.role !== 'admin') {
        q = q.eq('publisher_id', user.id)
      }
      const { data } = await q
      if (data) setEvents(data as Event[])
    })
  }, [])

  const generatePosts = async () => {
    if (!selectedEvent) return
    setLoading(true)
    const days = selectedPattern.key === 'custom'
      ? customDays.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n))
      : selectedPattern.days

    const res = await fetch('/api/social/countdown-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: selectedEvent.id, countdownDays: days }),
    })
    const data = await res.json()
    if (data.posts) {
      setGeneratedPosts(data.posts)
      setStep(3)
    } else {
      alert(data.error || 'Failed to generate')
    }
    setLoading(false)
  }

  const updatePost = (i: number, content: string) => {
    const next = [...generatedPosts]
    next[i] = { ...next[i], content }
    setGeneratedPosts(next)
  }

  const scheduleAll = async () => {
    if (!selectedEvent || !userId) return
    setLoading(true)

    const eventDate = new Date(selectedEvent.date + 'T' + postTime)
    const [hours, minutes] = postTime.split(':').map(Number)

    for (const post of generatedPosts) {
      const scheduledDate = new Date(eventDate)
      scheduledDate.setDate(scheduledDate.getDate() - post.daysOut)
      scheduledDate.setHours(hours, minutes, 0, 0)

      if (scheduledDate < new Date()) continue // Skip past dates

      await supabase.from('scheduled_posts').insert({
        user_id: userId,
        title: `Countdown: ${selectedEvent.title} (${post.daysOut > 0 ? `${post.daysOut} days` : post.daysOut === 0 ? 'day-of' : `recap`})`,
        content: post.content,
        link_url: selectedEvent.ticket_url || '',
        platforms: selectedPlatforms,
        schedule_type: 'once',
        scheduled_for: scheduledDate.toISOString(),
        next_run_at: scheduledDate.toISOString(),
        status: 'scheduled',
        event_id: selectedEvent.id,
        countdown_pattern: selectedPattern.key,
      })
    }

    setLoading(false)
    router.push('/social/queue')
  }

  const filteredEvents = events.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <Target size={28} />
            Countdown Campaigns
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Auto-schedule countdown posts that build hype for your events</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto">
          {['Pick Event', 'Pattern', 'Content', 'Schedule'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step > i ? 'bg-green-500/20 text-green-400' : step === i + 1 ? 'bg-[#E8970A] text-black' : 'bg-[#1A1726] text-gray-500'}`}>
                {step > i ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${step >= i + 1 ? 'text-white' : 'text-gray-500'}`}>{label}</span>
              {i < 3 && <ArrowRight size={14} className="text-gray-600 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Pick event */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your events..."
              className="w-full px-4 py-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white"
            />
            {filteredEvents.length === 0 ? (
              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
                No upcoming published events. Submit and approve an event first.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEvent(ev); setStep(2) }}
                    className="text-left bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/50 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {ev.image_url && <img src={ev.image_url} alt="" className="w-16 h-16 object-cover rounded-lg" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{ev.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{ev.date} · {ev.city}</p>
                        <p className="text-xs text-gray-500 truncate">{ev.venue}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pattern */}
        {step === 2 && selectedEvent && (
          <div className="space-y-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4 flex items-center gap-3">
              <Calendar size={20} className="text-[#E8970A]" />
              <div>
                <div className="font-semibold text-white">{selectedEvent.title}</div>
                <div className="text-xs text-gray-500">{selectedEvent.date} · {selectedEvent.city}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PATTERNS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPattern(p)}
                  className={`text-left p-4 rounded-xl border transition-colors ${selectedPattern.key === p.key ? 'bg-[#E8970A]/10 border-[#E8970A]' : 'bg-[#0F0D1A] border-[#1A1726] hover:border-[#E8970A]/30'}`}
                >
                  <h3 className="font-semibold text-white">{p.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                  <div className="mt-2 text-xs text-[#E8970A]">{p.days.length} posts</div>
                </button>
              ))}
              <button
                onClick={() => setSelectedPattern({ key: 'custom', label: 'Custom', days: [], desc: 'Enter your own days' })}
                className={`text-left p-4 rounded-xl border ${selectedPattern.key === 'custom' ? 'bg-[#E8970A]/10 border-[#E8970A]' : 'bg-[#0F0D1A] border-[#1A1726] hover:border-[#E8970A]/30'}`}
              >
                <h3 className="font-semibold text-white">Custom</h3>
                <input
                  type="text"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="e.g. 14, 7, 3, 1, 0"
                  className="w-full mt-2 px-3 py-1.5 rounded bg-[#070510] border border-[#1A1726] text-white text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5">Back</button>
              <button
                onClick={generatePosts}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#E8970A] text-black hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                {loading ? 'Generating with AI...' : 'Generate Countdown Posts'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Content */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Edit any post before scheduling. AI generated these for you.</p>
            {generatedPosts.map((post, i) => (
              <div key={i} className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4">
                <div className="text-xs text-[#E8970A] mb-2 font-medium">
                  {post.daysOut > 0 ? `${post.daysOut} days before` : post.daysOut === 0 ? 'Day of event' : `${Math.abs(post.daysOut)} days after`}
                </div>
                <textarea
                  value={post.content}
                  onChange={(e) => updatePost(i, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
                />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#E8970A] text-black hover:opacity-90">Continue</button>
            </div>
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Choose Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatforms(selectedPlatforms.includes(p) ? selectedPlatforms.filter(x => x !== p) : [...selectedPlatforms, p])}
                    className={`px-3 py-1.5 rounded-lg text-xs ${selectedPlatforms.includes(p) ? 'bg-[#E8970A] text-black' : 'bg-[#070510] border border-[#1A1726] text-gray-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Time of Day</h3>
              <input
                type="time"
                value={postTime}
                onChange={(e) => setPostTime(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white"
              />
              <p className="text-xs text-gray-500 mt-2">All countdown posts will go out at this time</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5">Back</button>
              <button
                onClick={scheduleAll}
                disabled={loading || selectedPlatforms.length === 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#E8970A] text-black hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : `Schedule ${generatedPosts.length} Posts`}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
