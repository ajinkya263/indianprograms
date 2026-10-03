'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarDays,
  Sparkles,
  Star,
  PenSquare,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Festival {
  id: string
  name: string
  date: string
  description: string | null
  default_greeting: string | null
  emoji: string | null
  is_major: boolean | null
  slug?: string | null
}

type View = 'upcoming' | 'calendar' | 'month'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysUntil(dateStr: string): { text: string; days: number } {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return { text: 'Past', days: diff }
  if (diff === 0) return { text: 'Today!', days: 0 }
  if (diff === 1) return { text: 'Tomorrow', days: 1 }
  if (diff < 7) return { text: `${diff} days`, days: diff }
  if (diff < 14) return { text: '1 week away', days: diff }
  if (diff < 30) return { text: `${Math.round(diff / 7)} weeks away`, days: diff }
  if (diff < 60) return { text: '1 month away', days: diff }
  return { text: `${Math.round(diff / 30)} months away`, days: diff }
}

export default function CulturalCalendarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [festivals, setFestivals] = useState<Festival[]>([])
  const [view, setView] = useState<View>('upcoming')
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [countdownFestival, setCountdownFestival] = useState<Festival | null>(null)
  const [countdownDays, setCountdownDays] = useState<number[]>([7, 3, 1, 0])
  const [countdownSaving, setCountdownSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('festivals')
        .select('*')
        .gte('date', today.slice(0, 4) + '-01-01')
        .order('date', { ascending: true })
      setFestivals((data as Festival[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const upcoming = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return festivals
      .filter((f) => new Date(f.date + 'T00:00:00') >= today)
      .slice(0, 12)
  }, [festivals])

  const byMonth = useMemo(() => {
    const groups: Record<string, Festival[]> = {}
    festivals.forEach((f) => {
      const d = new Date(f.date + 'T00:00:00')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!groups[key]) groups[key] = []
      groups[key].push(f)
    })
    return groups
  }, [festivals])

  const handleCreatePost = (f: Festival) => {
    const key = f.slug || f.id
    router.push(`/social/compose?festival=${encodeURIComponent(key)}`)
  }

  const openCountdown = (f: Festival) => {
    setCountdownFestival(f)
    setCountdownDays([7, 3, 1, 0])
  }

  const toggleCountdownDay = (day: number) => {
    setCountdownDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    )
  }

  const saveCountdown = async () => {
    if (!countdownFestival) return
    setCountdownSaving(true)
    // Navigate to compose for day-of; remaining countdown days can be scheduled there.
    const key = countdownFestival.slug || countdownFestival.id
    router.push(
      `/social/compose?festival=${encodeURIComponent(key)}&countdown=${countdownDays.join(',')}`
    )
  }

  const renderCard = (f: Festival) => {
    const du = daysUntil(f.date)
    const major = !!f.is_major
    return (
      <div
        key={f.id}
        className={`relative rounded-xl bg-[#0F0D1A] border p-6 transition-colors ${
          major ? 'border-[#E8970A]/60 shadow-[0_0_20px_rgba(232,151,10,0.1)]' : 'border-[#1A1726]'
        }`}
      >
        {major && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-[#E8970A]">
            <Star size={14} fill="#E8970A" />
            Major
          </div>
        )}
        <div className="flex items-start gap-4 mb-3">
          <div className={`${major ? 'text-6xl' : 'text-5xl'} leading-none`}>
            {f.emoji || '🪔'}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs uppercase tracking-wider text-[#E8970A] mb-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {formatDate(f.date)}
            </div>
            <h3
              className={`${major ? 'text-2xl' : 'text-xl'} font-bold mb-1`}
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {f.name}
            </h3>
            <div className="text-xs text-gray-400">{du.text}</div>
          </div>
        </div>
        {f.description && (
          <p
            className="text-sm text-gray-400 mb-3 line-clamp-3"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {f.description}
          </p>
        )}
        {f.default_greeting && (
          <div
            className="text-sm italic text-[#E8970A]/90 mb-4"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            "{f.default_greeting}"
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => handleCreatePost(f)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#E8970A] text-black text-sm font-semibold hover:bg-[#F5A820] transition-colors"
          >
            <PenSquare size={14} />
            Create Post
          </button>
          <button
            onClick={() => openCountdown(f)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#1A1726] text-sm text-gray-300 hover:border-[#E8970A]/50 transition-colors"
          >
            <Bell size={14} />
            Countdown
          </button>
        </div>
      </div>
    )
  }

  const renderCalendarGrid = () => {
    const { year, month } = calMonth
    const first = new Date(year, month, 1)
    const startDay = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const festByDay: Record<number, Festival[]> = {}
    festivals.forEach((f) => {
      const d = new Date(f.date + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!festByDay[day]) festByDay[day] = []
        festByDay[day].push(f)
      }
    })

    return (
      <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              const m = month - 1
              setCalMonth(m < 0 ? { year: year - 1, month: 11 } : { year, month: m })
            }}
            className="p-2 rounded-lg hover:bg-[#1A1726]"
          >
            <ChevronLeft size={18} />
          </button>
          <h3
            className="text-xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {MONTHS[month]} {year}
          </h3>
          <button
            onClick={() => {
              const m = month + 1
              setCalMonth(m > 11 ? { year: year + 1, month: 0 } : { year, month: m })
            }}
            className="p-2 rounded-lg hover:bg-[#1A1726]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs text-gray-500 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((c, i) => {
            if (c === null) return <div key={i} />
            const fs = festByDay[c] || []
            const hasMajor = fs.some((f) => f.is_major)
            return (
              <div
                key={i}
                className={`min-h-[70px] p-1 sm:p-2 rounded-lg border text-left ${
                  fs.length
                    ? hasMajor
                      ? 'bg-[#E8970A]/10 border-[#E8970A]/50'
                      : 'bg-[#1A1726] border-[#1A1726]'
                    : 'border-transparent'
                }`}
              >
                <div className="text-xs text-gray-400">{c}</div>
                {fs.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleCreatePost(f)}
                    className="block w-full text-left text-xs mt-1 truncate hover:text-[#E8970A]"
                    title={f.name}
                  >
                    {f.emoji} {f.name}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <Navbar />

      <section className="relative border-b border-white/5 bg-gradient-to-b from-[#0F0D1A] to-[#070510]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDays size={24} style={{ color: '#E8970A' }} />
            <span
              className="text-sm uppercase tracking-wider"
              style={{ color: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Festival Awareness
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Cultural <span style={{ color: '#E8970A' }}>Calendar</span>
          </h1>
          <p
            className="text-lg text-gray-400 max-w-2xl"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Plan posts around Indian festivals and cultural moments.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* View switcher */}
        <div className="flex gap-2 mb-8 border-b border-[#1A1726]">
          {(
            [
              { k: 'upcoming', label: 'Upcoming' },
              { k: 'calendar', label: 'Calendar View' },
              { k: 'month', label: 'By Month' },
            ] as { k: View; label: string }[]
          ).map((v) => (
            <button
              key={v.k}
              onClick={() => setView(v.k)}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                view === v.k
                  ? 'border-[#E8970A] text-[#E8970A]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading festivals...</div>
        ) : festivals.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No festivals found. Run the migration to seed festivals.
          </div>
        ) : (
          <>
            {view === 'upcoming' && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={18} style={{ color: '#E8970A' }} />
                  <h2
                    className="text-2xl font-bold"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Next 12 Festivals
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map(renderCard)}
                </div>
              </>
            )}

            {view === 'calendar' && renderCalendarGrid()}

            {view === 'month' && (
              <div className="space-y-10">
                {Object.entries(byMonth).map(([key, items]) => {
                  const [y, m] = key.split('-').map(Number)
                  return (
                    <div key={key}>
                      <h2
                        className="text-2xl font-bold mb-4"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {MONTHS[m]} <span className="text-gray-500">{y}</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map(renderCard)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Countdown modal */}
      {countdownFestival && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[calc(100vw-2rem)] md:max-w-md rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#E8970A] mb-1">
                  Schedule Countdown
                </div>
                <h3
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {countdownFestival.emoji} {countdownFestival.name}
                </h3>
                <div className="text-sm text-gray-400 mt-1">
                  {formatDate(countdownFestival.date)}
                </div>
              </div>
              <button
                onClick={() => setCountdownFestival(null)}
                className="p-1 rounded hover:bg-[#1A1726]"
              >
                <X size={18} />
              </button>
            </div>
            <p
              className="text-sm text-gray-400 mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Select which countdown posts to schedule:
            </p>
            <div className="space-y-2 mb-6">
              {[
                { d: 7, label: '1 week before' },
                { d: 3, label: '3 days before' },
                { d: 1, label: '1 day before' },
                { d: 0, label: 'Day of' },
              ].map((opt) => (
                <label
                  key={opt.d}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#1A1726] cursor-pointer hover:border-[#E8970A]/50"
                >
                  <input
                    type="checkbox"
                    checked={countdownDays.includes(opt.d)}
                    onChange={() => toggleCountdownDay(opt.d)}
                    className="accent-[#E8970A]"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCountdownFestival(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-[#1A1726] text-sm hover:bg-[#1A1726]"
              >
                Cancel
              </button>
              <button
                onClick={saveCountdown}
                disabled={countdownSaving || countdownDays.length === 0}
                className="flex-1 px-4 py-2 rounded-lg bg-[#E8970A] text-black text-sm font-semibold hover:bg-[#F5A820] disabled:opacity-50"
              >
                {countdownSaving ? 'Loading...' : 'Compose Posts'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
