'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, XCircle, MapPin, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'
import { cityMatchesMetro, sortEventsByCity, CATEGORIES, groupEventsByTitle, LANGUAGES } from '@/lib/constants'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CityTabs from '@/components/CityTabs'
import EventCard from '@/components/EventCard'
import HeroCarousel from '@/components/HeroCarousel'
import EventCarousel from '@/components/EventCarousel'
// Decorative elements removed — using pure CSS atmospheric design

type PriceFilter = 'All' | 'Free' | 'Paid'

function applyDateFilter(events: Event[], filter: string): Event[] {
  if (filter === 'All Dates') return events
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  if (filter === 'Today') return events.filter(e => e.date === todayStr)

  if (filter === 'Tomorrow') {
    const t = new Date(today); t.setDate(t.getDate() + 1)
    return events.filter(e => e.date === t.toISOString().split('T')[0])
  }

  if (filter === 'This Weekend') {
    const dayOfWeek = today.getDay()
    const daysUntilSat = (6 - dayOfWeek + 7) % 7
    const sat = new Date(today); sat.setDate(sat.getDate() + daysUntilSat)
    const sun = new Date(sat); sun.setDate(sun.getDate() + 1)
    const satStr = sat.toISOString().split('T')[0]
    const sunStr = sun.toISOString().split('T')[0]
    return events.filter(e => e.date === satStr || e.date === sunStr)
  }

  if (filter === 'This Week') {
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    return events.filter(e => e.date >= todayStr && e.date <= weekEndStr)
  }

  if (filter === 'This Month') {
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const monthEndStr = monthEnd.toISOString().split('T')[0]
    return events.filter(e => e.date >= todayStr && e.date <= monthEndStr)
  }

  return events
}

function HomePageInner() {
  const searchParams = useSearchParams()

  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  // Metro filter — Bay Area is the default home region; other metros are
  // available as pills. The CityTabs component owns pill rendering; this
  // state is what drives the filter downstream (cityMatchesMetro + sort).
  const [city, setCity] = useState<string>(searchParams.get('metro') || 'Bay Area')
  const [category, setCategory] = useState<string | null>(searchParams.get('cat') || null)
  const [price, setPrice] = useState<PriceFilter>((searchParams.get('price') as PriceFilter) || 'All')
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get('dt') || 'All Dates')
  const [language, setLanguage] = useState<string>(searchParams.get('lang') || '')
  const [priorityCity] = useState<string>('Bay Area')
  const [showAdvanced, setShowAdvanced] = useState(false)
  // Filter bar layout — V2 (compact three-dropdown) is the chosen
  // variant. V1 (stacked pill rows) and V3 (labeled sections) are still
  // in the render tree below but never selected; keeping them lets us
  // revisit without rewiring state.
  const [filterLayout] = useState<'v1' | 'v2' | 'v3'>('v2')
  const [advancedFilters, setAdvancedFilters] = useState({
    specificCity: searchParams.get('city') || '',
    dateFrom: searchParams.get('from') || '',
    dateTo: searchParams.get('to') || '',
    zipCode: searchParams.get('zip') || '',
  })

  // Sync filters to URL search params using history API (avoids React re-renders)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return

    const params = new URLSearchParams()
    if (city !== 'All Cities') params.set('metro', city)
    if (category) params.set('cat', category)
    if (price !== 'All') params.set('price', price)
    if (dateFilter !== 'All Dates') params.set('dt', dateFilter)
    if (language) params.set('lang', language)
    if (search.trim()) params.set('q', search.trim())
    if (advancedFilters.dateFrom) params.set('from', advancedFilters.dateFrom)
    if (advancedFilters.dateTo) params.set('to', advancedFilters.dateTo)
    if (advancedFilters.zipCode) params.set('zip', advancedFilters.zipCode)
    if (advancedFilters.specificCity) params.set('city', advancedFilters.specificCity)

    const paramStr = params.toString()
    const newUrl = paramStr ? `/?${paramStr}` : '/'
    window.history.replaceState(null, '', newUrl)
  }, [city, category, price, dateFilter, search, advancedFilters, mounted, language])

  const activeAdvancedCount = [
    advancedFilters.specificCity,
    advancedFilters.dateFrom,
    advancedFilters.dateTo,
    advancedFilters.zipCode,
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setCategory(null)
    setPrice('All')
    setDateFilter('All Dates')
    setSearch('')
    setLanguage('')
    setAdvancedFilters({ specificCity: '', dateFrom: '', dateTo: '', zipCode: '' })
  }

  const clearAdvancedFilters = () => {
    setAdvancedFilters({ specificCity: '', dateFrom: '', dateTo: '', zipCode: '' })
  }

  // Site is Bay-Area-only — geolocation override removed.

  // Fetch all published events
  const fetchAllEvents = async () => {
    console.log('[home] fetchAllEvents called')
    setLoading(true)
    const supabase = createClient()

    // Fetch events from 90 days ago onwards (for "recently concluded" section)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const dateFloor = ninetyDaysAgo.toISOString().split('T')[0]

    let query = supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('date', dateFloor)

    if (category) {
      query = query.eq('category', category)
    }

    if (price !== 'All') {
      query = query.eq('price', price)
    }

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    query = query.order('date', { ascending: true })

    const { data, error } = await query

    console.log('[home] fetchAllEvents result:', { count: data?.length, error })
    if (!error && data) {
      setAllEvents(data as Event[])
    } else {
      setAllEvents([])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchAllEvents()
  }, [category, price, search, refreshKey])

  // Trigger refresh on browser back/forward and visibility changes
  useEffect(() => {
    const triggerRefresh = () => setRefreshKey(k => k + 1)

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) triggerRefresh()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') triggerRefresh()
    }
    const handleFocus = () => triggerRefresh()
    const handlePopState = () => triggerRefresh()

    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // No-op: city filter is pinned to Bay Area; search-based metro switching
  // is no longer relevant.

  // Client-side metro area filtering + priority city sorting + advanced filters
  useEffect(() => {
    let filtered: Event[]
    if (city === 'All Cities') {
      filtered = allEvents
    } else {
      filtered = allEvents.filter(e =>
        cityMatchesMetro(e.city, city) || e.metro_region === city
      )
    }
    // Advanced filters
    if (advancedFilters.specificCity) {
      filtered = filtered.filter(e =>
        e.city.toLowerCase().includes(advancedFilters.specificCity.toLowerCase())
      )
    }
    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(e => e.date >= advancedFilters.dateFrom)
    }
    if (advancedFilters.dateTo) {
      filtered = filtered.filter(e => e.date <= advancedFilters.dateTo)
    }
    if (advancedFilters.zipCode) {
      filtered = filtered.filter(e => e.zip_code === advancedFilters.zipCode)
    }
    if (language) {
      // "Multilingual" matches events tagged Multilingual OR events that
      // set no language at all (crawler couldn't determine one).
      filtered = filtered.filter(e =>
        language === 'Multilingual'
          ? !e.language || e.language === 'Multilingual'
          : e.language === language
      )
    }
    // Apply date filter
    filtered = applyDateFilter(filtered, dateFilter)
    // Split into upcoming and past
    const today = new Date().toISOString().split('T')[0]
    const upcoming = filtered.filter(e => e.date >= today)
    const past = filtered.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)

    // Sort upcoming: priority city first, then by date
    if (priorityCity) {
      setEvents(sortEventsByCity(upcoming, priorityCity))
    } else {
      setEvents(upcoming)
    }
    setPastEvents(past)
  }, [city, allEvents, priorityCity, advancedFilters, dateFilter, language])

  const priceOptions: PriceFilter[] = ['All', 'Free', 'Paid']

  // Group recurring events (same title) into a single card with a
  // "+N more dates" chip. Everything downstream — grids, carousels,
  // hero — reads groupedEvents so the same event never shows twice.
  const groupedEvents = groupEventsByTitle(events)
  const groupedPastEvents = groupEventsByTitle(pastEvents)

  // Featured events for hero banner: paid events with images, top 5 by date
  const featuredEvents = groupedEvents
    .filter(e => e.image_url && e.price === 'Paid')
    .slice(0, 5)


  // Weekend events: Sat/Sun within next 14 days
  const weekendEvents = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    return groupedEvents.filter(e => {
      const d = new Date(e.date + 'T00:00:00')
      const day = d.getDay()
      return (day === 0 || day === 6) && d <= cutoff
    }).slice(0, 10)
  })()

  // Free events
  const freeEvents = groupedEvents.filter(e => e.price === 'Free').slice(0, 10)

  const hasActiveFilters = city !== 'All Cities' || category || price !== 'All' || search.trim() || dateFilter !== 'All Dates' || language || activeAdvancedCount > 0


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section — compact */}
      <section className="relative overflow-hidden hero-premium">
        {/* Warm atmospheric bokeh */}
        <div className="absolute top-[-20%] left-[-5%] w-[500px] h-[500px] bg-[#FF9933]/[0.18] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-[#FFD700]/[0.14] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[25%] w-[600px] h-[600px] bg-[#FF6B00]/[0.10] rounded-full blur-[130px] pointer-events-none" />

        {/* Large faded mandala watermark — centered behind text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mandala-bg w-[500px] h-[500px] opacity-[0.08]" />
        </div>

        {/* Top golden accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-b from-[#FF9933]/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 text-center relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 leading-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Discover{' '}
            <span className="text-tricolor">Indian Cultural Events</span>{' '}
            Across North America
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm text-gray-400 max-w-xl mx-auto mb-2.5"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Festivals, concerts, dance, theatre, cinema and community celebrations — curated Indian cultural events across major North American metros
          </motion.p>

          {/* Search Bar — compact */}
          <div className="max-w-2xl mx-auto relative search-glow rounded-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, artists, venues..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-gray-500 border border-dark-border focus:border-saffron/50 focus:outline-none focus:ring-1 focus:ring-saffron/30 transition-colors text-sm"
              style={{
                backgroundColor: '#0F0D1A',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          {/* Inline filter actions */}
          <div className="max-w-2xl mx-auto mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-dark-border hover:border-gray-500 bg-dark-card transition-all"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Filter size={14} />
              Filters
              {activeAdvancedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-saffron text-black font-bold">
                  {activeAdvancedCount}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rang-red hover:text-white border border-rang-red/30 hover:border-rang-red/60 bg-rang-red/5 transition-all"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <XCircle size={14} />
                Clear All
              </button>
            )}
          </div>

          {/* Advanced Search Panel */}
          {showAdvanced && (
            <div className="max-w-2xl mx-auto mt-3 p-4 rounded-xl border border-dark-border bg-dark-card space-y-4">
              {/* Date quick-picks (moved from the sticky bar) */}
              <div>
                <label className="block text-xs text-gray-500 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Date
                </label>
                <div className="flex items-center flex-wrap gap-1.5">
                  {['All Dates', 'Today', 'This Weekend', 'This Week', 'This Month'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setDateFilter(f)}
                      className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                        dateFilter === f ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {dateFilter === f && (
                        <motion.span layoutId="dateActive" className="absolute inset-0 rounded-full bg-saffron" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                      )}
                      <span className="relative z-10">{f}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={advancedFilters.specificCity}
                    onChange={(e) => setAdvancedFilters(f => ({ ...f, specificCity: e.target.value }))}
                    placeholder="e.g. Fremont"
                    className="w-full px-3 py-1.5 rounded-lg text-xs text-white placeholder-gray-600 border border-dark-border focus:border-saffron/50 focus:outline-none transition-colors"
                    style={{ backgroundColor: '#0F0D1A', fontFamily: 'DM Sans, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={advancedFilters.zipCode}
                    onChange={(e) => setAdvancedFilters(f => ({ ...f, zipCode: e.target.value }))}
                    placeholder="e.g. 94536"
                    className="w-full px-3 py-1.5 rounded-lg text-xs text-white placeholder-gray-600 border border-dark-border focus:border-saffron/50 focus:outline-none transition-colors"
                    style={{ backgroundColor: '#0F0D1A', fontFamily: 'DM Sans, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    From
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => setAdvancedFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg text-xs text-white border border-dark-border focus:border-saffron/50 focus:outline-none transition-colors"
                    style={{ backgroundColor: '#0F0D1A', fontFamily: 'DM Sans, sans-serif', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    To
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dateTo}
                    onChange={(e) => setAdvancedFilters(f => ({ ...f, dateTo: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg text-xs text-white border border-dark-border focus:border-saffron/50 focus:outline-none transition-colors"
                    style={{ backgroundColor: '#0F0D1A', fontFamily: 'DM Sans, sans-serif', colorScheme: 'dark' }}
                  />
                </div>
              </div>
              {activeAdvancedCount > 0 && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={clearAdvancedFilters}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-400 hover:text-white transition-all"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    <XCircle size={12} />
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tricolor divider */}
        <div className="tricolor-line w-full" />
      </section>

      {/* Sticky Filter Bar */}
      <section className="sticky top-0 z-30 bg-[#070510]/95 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2">
          {/* Layout switcher is hidden — V1 and V3 are disabled but their
              JSX is retained below so we can re-enable without rewiring. */}

          {/* ─────────────────────── V1: current stacked pills (disabled) ─────────────────────── */}
          {filterLayout === 'v1' && (
            <>
              <CityTabs city={city} onCityChange={setCity} />
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setCategory(null)}
                  className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                    category === null ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                  }`}
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {category === null && (
                    <motion.span layoutId="categoryActive" className="absolute inset-0 rounded-full bg-saffron" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  <span className="relative z-10">All</span>
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                      category === cat.key ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {category === cat.key && (
                      <motion.span layoutId="categoryActive" className="absolute inset-0 rounded-full bg-saffron" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                    <span className="relative z-10">{cat.emoji} {cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {priceOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPrice(opt)}
                    className={`relative px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                      price === opt ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {price === opt && (
                      <motion.span layoutId="priceActive" className="absolute inset-0 rounded-full bg-saffron" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                    <span className="relative z-10">{opt === 'All' ? 'Any Price' : opt}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─────────────────────── V2: compact 3-dropdown selector (active) ─────────────────────── */}
          {filterLayout === 'v2' && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* City dropdown */}
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {[
                    { key: 'Bay Area', label: 'Bay Area' },
                    { key: 'LA', label: 'Los Angeles' },
                    { key: 'New York', label: 'New York' },
                    { key: 'Seattle', label: 'Seattle' },
                    { key: 'Chicago', label: 'Chicago' },
                    { key: 'Houston', label: 'Houston' },
                    { key: 'Dallas', label: 'Dallas-Fort Worth' },
                    { key: 'Boston', label: 'Boston' },
                    { key: 'DC', label: 'Washington DC' },
                    { key: 'Atlanta', label: 'Atlanta' },
                    { key: 'NJ', label: 'New Jersey' },
                    { key: 'Austin', label: 'Austin' },
                  ].map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--accent)' }} />
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
              {/* Category dropdown */}
              <div className="relative">
                <select
                  value={category ?? ''}
                  onChange={(e) => setCategory(e.target.value || null)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <option value="">🎭 All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
              {/* Price dropdown */}
              <div className="relative">
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value as PriceFilter)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {priceOptions.map((opt) => (
                    <option key={opt} value={opt}>💰 {opt === 'All' ? 'Any Price' : opt}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
              {/* Language dropdown */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <option value="">🗣 Any Language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.key} value={l.key}>🗣 {l.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          {/* ─────────────────────── V3: labeled sections (disabled) ─────────────────────── */}
          {filterLayout === 'v3' && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500 mb-1 pl-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Location
                </div>
                <CityTabs city={city} onCityChange={setCity} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500 mb-1 pl-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Event Type
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setCategory(null)}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                      category === null ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {category === null && <span className="absolute inset-0 rounded-full bg-saffron" />}
                    <span className="relative z-10">All</span>
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCategory(cat.key)}
                      className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                        category === cat.key ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {category === cat.key && <span className="absolute inset-0 rounded-full bg-saffron" />}
                      <span className="relative z-10">{cat.emoji} {cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500 mb-1 pl-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Price
                </div>
                <div className="flex items-center gap-1.5">
                  {priceOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPrice(opt)}
                      className={`relative px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
                        price === opt ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {price === opt && <span className="absolute inset-0 rounded-full bg-saffron" />}
                      <span className="relative z-10">{opt === 'All' ? 'Any Price' : opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hero Banner Carousel — only show when no active filters */}
      {!loading && featuredEvents.length > 0 && !hasActiveFilters && (
        <section className="pb-8">
          <HeroCarousel events={featuredEvents} />
        </section>
      )}


      {/* This Weekend Carousel — only show when no active filters */}
      {!loading && weekendEvents.length > 0 && !hasActiveFilters && (
        <EventCarousel title="This Weekend" events={weekendEvents} />
      )}

      {/* Free Events Carousel — only show when no active filters */}
      {!loading && freeEvents.length > 0 && !hasActiveFilters && (
        <EventCarousel title="Free Events" events={freeEvents} />
      )}

      {/* Events Grid */}
      <section id="events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1">
        <h2
          className="text-2xl font-semibold text-white mb-6 flex items-center gap-3"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          <span className="w-1.5 h-6 bg-saffron rounded-full inline-block" />
          Upcoming Events
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border"
                style={{ backgroundColor: '#0F0D1A', borderColor: '#1A1726' }}
              >
                <div className="h-48 skeleton-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-5 skeleton-shimmer rounded w-3/4" />
                  <div className="h-4 skeleton-shimmer rounded w-1/2" />
                  <div className="h-4 skeleton-shimmer rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0F0D1A] border border-[#1A1726] mb-4">
              <Search size={26} className="text-gray-500" />
            </div>
            <p className="text-white text-lg font-medium mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              No events found
            </p>
            <p className="text-gray-500 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Try adjusting your filters or clearing the search.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-black bg-saffron hover:opacity-90 transition-opacity"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <XCircle size={14} />
                Clear all filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {groupedEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} extraDates={event.extraDates} />
            ))}
          </div>
        )}

        {/* Recently Concluded Events */}
        {!loading && pastEvents.length > 0 && (
          <>
            <div className="flex items-center gap-4 mt-16 mb-8">
              <div className="flex-1 h-px bg-dark-border" />
              <span className="text-sm text-gray-500 font-medium px-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Recently Concluded
              </span>
              <div className="flex-1 h-px bg-dark-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr opacity-60">
              {groupedPastEvents.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} extraDates={event.extraDates} />
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <HomePageInner />
    </Suspense>
  )
}
