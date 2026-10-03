'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { ScheduledPost, PLATFORMS } from '@/lib/social-types'
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Edit,
  Pause,
  Play,
  Copy,
  Trash2,
  X,
  Search,
  Filter,
} from 'lucide-react'

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'all' | ScheduledPost['status']

const STATUS_COLORS: Record<ScheduledPost['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  draft: 'bg-purple-100 text-purple-800 border-purple-200',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatSchedule(post: ScheduledPost): string {
  if (post.schedule_type === 'recurring') {
    const parts: string[] = ['Recurring:']
    const interval = post.recurrence_interval || 1
    if (post.recurrence_pattern === 'daily') {
      parts.push(interval === 1 ? 'Every day' : `Every ${interval} days`)
    } else if (post.recurrence_pattern === 'weekly') {
      const days = post.recurrence_days_of_week?.length
        ? post.recurrence_days_of_week.map((d) => DAY_NAMES[d]).join(' & ')
        : 'Weekly'
      parts.push(days)
    } else if (post.recurrence_pattern === 'monthly') {
      parts.push(interval === 1 ? 'Every month' : `Every ${interval} months`)
    }
    if (post.recurrence_times_of_day?.length) {
      parts.push(`at ${post.recurrence_times_of_day[0]}`)
    }
    return parts.join(' ')
  }
  if (!post.scheduled_for) return 'Not scheduled'
  const date = new Date(post.scheduled_for)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay(date, now)) return `Today at ${timeStr}`
  if (sameDay(date, tomorrow)) return `Tomorrow at ${timeStr}`
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`
}

function getPostBucket(post: ScheduledPost): 'past' | 'today' | 'tomorrow' | 'week' | 'later' {
  const ref = post.next_run_at || post.scheduled_for
  if (!ref) return 'later'
  const date = new Date(ref)
  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  if (date < today) return 'past'
  if (sameDay(date, now)) return 'today'
  if (sameDay(date, tomorrow)) return 'tomorrow'
  if (date < weekEnd) return 'week'
  return 'later'
}

function postAppearsOnDay(post: ScheduledPost, day: Date): boolean {
  const dayStart = startOfDay(day)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  if (post.schedule_type === 'recurring') {
    if (post.recurrence_end_date && new Date(post.recurrence_end_date) < dayStart) return false
    const startRef = post.next_run_at || post.scheduled_for || post.created_at
    if (startRef && new Date(startRef) > dayEnd) return false
    switch (post.recurrence_pattern) {
      case 'daily':
        return true
      case 'weekly':
        if (post.recurrence_days_of_week?.length) {
          return post.recurrence_days_of_week.includes(day.getDay())
        }
        return true
      case 'monthly':
        if (startRef) return new Date(startRef).getDate() === day.getDate()
        return false
      default:
        return false
    }
  }

  const ref = post.next_run_at || post.scheduled_for
  if (!ref) return false
  return sameDay(new Date(ref), day)
}

export default function QueuePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [view, setView] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [search, setSearch] = useState('')

  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('next_run_at', { ascending: true, nullsFirst: false })
      if (error) {
        console.error(error)
      } else {
        setPosts((data || []) as ScheduledPost[])
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = posts.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (platformFilter !== 'all' && !(p.platforms || []).includes(platformFilter)) return false
    if (search) {
      const s = search.toLowerCase()
      const hay = `${p.title || ''} ${p.content || ''}`.toLowerCase()
      if (!hay.includes(s)) return false
    }
    const ref = p.next_run_at || p.scheduled_for
    if (dateFrom && ref && new Date(ref) < new Date(dateFrom)) return false
    if (dateTo && ref && new Date(ref) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const updateStatus = async (id: string, status: ScheduledPost['status']) => {
    const { error } = await supabase
      .from('scheduled_posts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      alert('Failed: ' + error.message)
      return
    }
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const handlePauseResume = (post: ScheduledPost) => {
    const next = post.status === 'scheduled' ? 'paused' : 'scheduled'
    updateStatus(post.id, next)
  }

  const handleCancel = async (post: ScheduledPost) => {
    if (!confirm('Cancel this scheduled post? It will stop running.')) return
    await updateStatus(post.id, 'cancelled')
  }

  const handleDelete = async (post: ScheduledPost) => {
    if (!confirm('Permanently delete this post? This cannot be undone.')) return
    const { error } = await supabase.from('scheduled_posts').delete().eq('id', post.id)
    if (error) {
      alert('Failed: ' + error.message)
      return
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
  }

  const handleEdit = (post: ScheduledPost) => {
    router.push(`/social/compose?id=${post.id}`)
  }

  const handleDuplicate = async (post: ScheduledPost) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const copy = {
      user_id: user.id,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      link_url: post.link_url,
      hashtags: post.hashtags,
      platform_content: post.platform_content,
      platforms: post.platforms,
      schedule_type: post.schedule_type,
      scheduled_for: post.scheduled_for,
      recurrence_pattern: post.recurrence_pattern,
      recurrence_interval: post.recurrence_interval,
      recurrence_days_of_week: post.recurrence_days_of_week,
      recurrence_times_of_day: post.recurrence_times_of_day,
      recurrence_end_date: post.recurrence_end_date,
      recurrence_max_runs: post.recurrence_max_runs,
      status: 'draft',
      total_runs: 0,
    }
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(copy)
      .select()
      .single()
    if (error) {
      alert('Failed: ' + error.message)
      return
    }
    router.push(`/social/compose?id=${data.id}`)
  }

  // Group by bucket for list view
  const buckets: Record<string, ScheduledPost[]> = {
    today: [],
    tomorrow: [],
    week: [],
    later: [],
    past: [],
  }
  for (const p of filtered) {
    buckets[getPostBucket(p)].push(p)
  }

  const BUCKET_LABELS: Array<[keyof typeof buckets, string]> = [
    ['today', 'Today'],
    ['tomorrow', 'Tomorrow'],
    ['week', 'This Week'],
    ['later', 'Later'],
    ['past', 'Past'],
  ]

  // Calendar grid
  const monthStart = new Date(calMonth)
  const gridStart = new Date(monthStart)
  gridStart.setDate(gridStart.getDate() - monthStart.getDay())
  const gridDays: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(d.getDate() + i)
    gridDays.push(d)
  }

  const postsForDay = (day: Date) => filtered.filter((p) => postAppearsOnDay(p, day))

  const today = new Date()

  const renderPostCard = (post: ScheduledPost) => (
    <div
      key={post.id}
      className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow"
    >
      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt=""
          className="w-20 h-20 object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {post.title || post.content?.split('\n')[0] || 'Untitled'}
            </h3>
            <p className="text-sm text-gray-500 truncate mt-0.5">{post.content}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[post.status]}`}
          >
            {post.status}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {(post.platforms || []).map((pk) => {
            const pf = PLATFORMS.find((x) => x.key === pk)
            if (!pf) return null
            return (
              <span
                key={pk}
                className="text-xs px-2 py-0.5 rounded text-white font-medium"
                style={{ backgroundColor: pf.color }}
              >
                {pf.label}
              </span>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>{formatSchedule(post)}</span>
          {post.schedule_type === 'recurring' && (
            <span className="text-gray-500">Runs: {post.total_runs || 0}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => handleEdit(post)}
            className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          {(post.status === 'scheduled' || post.status === 'paused') && (
            <button
              onClick={() => handlePauseResume(post)}
              className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              {post.status === 'scheduled' ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Resume
                </>
              )}
            </button>
          )}
          <button
            onClick={() => handleDuplicate(post)}
            className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          {post.status !== 'cancelled' && post.status !== 'completed' && (
            <button
              onClick={() => handleCancel(post)}
              className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded border border-gray-300 text-orange-700 hover:bg-orange-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
          <button
            onClick={() => handleDelete(post)}
            className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded border border-gray-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Posts</h1>
          <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                view === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" /> Calendar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            >
              <option value="all">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search post content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No scheduled posts yet.</p>
            <button
              onClick={() => router.push('/social/compose')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Compose your first post
            </button>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-8">
            {BUCKET_LABELS.map(([key, label]) => {
              const items = buckets[key]
              if (!items.length) return null
              return (
                <section key={key}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {label} ({items.length})
                  </h2>
                  <div className="space-y-3">{items.map(renderPostCard)}</div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {calMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))
                    }
                    className="p-1.5 rounded hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date()
                      d.setDate(1)
                      d.setHours(0, 0, 0, 0)
                      setCalMonth(d)
                    }}
                    className="px-3 py-1 text-sm rounded hover:bg-gray-100"
                  >
                    Today
                  </button>
                  <button
                    onClick={() =>
                      setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))
                    }
                    className="p-1.5 rounded hover:bg-gray-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs font-medium text-gray-500 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gridDays.map((day, i) => {
                  const inMonth = day.getMonth() === calMonth.getMonth()
                  const isToday = sameDay(day, today)
                  const isSelected = selectedDay && sameDay(day, selectedDay)
                  const dayPosts = postsForDay(day)
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square p-1 border rounded text-left text-sm transition-colors ${
                        inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                      } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'} ${
                        isSelected ? 'ring-2 ring-blue-400' : ''
                      } hover:bg-blue-50`}
                    >
                      <div className="font-medium">{day.getDate()}</div>
                      {dayPosts.length > 0 && (
                        <div className="mt-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                          {dayPosts.length}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <aside className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">
                {selectedDay
                  ? selectedDay.toLocaleDateString([], {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select a day'}
              </h3>
              {selectedDay ? (
                (() => {
                  const items = postsForDay(selectedDay)
                  if (!items.length) {
                    return <p className="text-sm text-gray-500">No posts this day.</p>
                  }
                  return (
                    <div className="space-y-3">
                      {items.map((p) => (
                        <div
                          key={p.id}
                          className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleEdit(p)}
                        >
                          <div className="font-medium text-sm truncate">
                            {p.title || p.content?.split('\n')[0] || 'Untitled'}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {(p.platforms || []).map((pk) => {
                              const pf = PLATFORMS.find((x) => x.key === pk)
                              if (!pf) return null
                              return (
                                <span
                                  key={pk}
                                  className="text-[10px] px-1.5 py-0.5 rounded text-white"
                                  style={{ backgroundColor: pf.color }}
                                >
                                  {pf.label}
                                </span>
                              )
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{formatSchedule(p)}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()
              ) : (
                <p className="text-sm text-gray-500">Click a day in the calendar to see posts.</p>
              )}
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
