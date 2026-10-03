'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  Hash,
  TrendingUp,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Search as SearchIcon,
} from 'lucide-react'

interface HashtagStat {
  id: string
  hashtag: string
  category: string | null
  metro: string | null
  usage_count: number | null
  effectiveness_score: number | null
  is_trending: boolean | null
  is_banned: boolean | null
}

type TabKey = 'trending' | 'metro' | 'category' | 'search'
type SortKey = 'effectiveness' | 'trending' | 'alpha'

const METROS = [
  '',
  'bay_area',
  'new_york',
  'houston',
  'dallas',
  'chicago',
  'seattle',
  'atlanta',
  'los_angeles',
  'boston',
]

const CATEGORIES = [
  '',
  'festival',
  'entertainment',
  'culture',
  'general',
  'community',
  'music',
  'dance',
  'food',
  'religion',
  'business',
]

export default function HashtagIntelligencePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tags, setTags] = useState<HashtagStat[]>([])
  const [tab, setTab] = useState<TabKey>('trending')
  const [metro, setMetro] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortKey>('effectiveness')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  // AI generator
  const [genText, setGenText] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState('')
  const [genResult, setGenResult] = useState<{ hashtags: string[]; reasoning: string } | null>(
    null
  )
  const [genCopied, setGenCopied] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from('hashtag_stats')
        .select('*')
        .eq('is_banned', false)
        .order('effectiveness_score', { ascending: false })
        .limit(500)
      setTags((data as HashtagStat[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...tags]
    if (tab === 'trending') list = list.filter((t) => t.is_trending)
    if (metro) list = list.filter((t) => (t.metro || '') === metro)
    if (category) list = list.filter((t) => (t.category || '') === category)
    if (tab === 'search' && search.trim()) {
      const q = search.trim().toLowerCase().replace(/^#/, '')
      list = list.filter((t) => t.hashtag.toLowerCase().includes(q))
    }

    if (sort === 'effectiveness') {
      list.sort((a, b) => (b.effectiveness_score || 0) - (a.effectiveness_score || 0))
    } else if (sort === 'trending') {
      list.sort(
        (a, b) =>
          Number(!!b.is_trending) - Number(!!a.is_trending) ||
          (b.effectiveness_score || 0) - (a.effectiveness_score || 0)
      )
    } else {
      list.sort((a, b) => a.hashtag.localeCompare(b.hashtag))
    }
    return list
  }, [tags, tab, metro, category, sort, search])

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1400)
  }

  const saveToTemplate = async (t: HashtagStat) => {
    if (!userId) return
    const { error } = await supabase.from('post_templates').insert({
      user_id: userId,
      name: `Hashtag: ${t.hashtag}`,
      category: t.category || 'general',
      description: `Saved from Hashtag Intelligence (score ${t.effectiveness_score || 0})`,
      content: '',
      hashtags: t.hashtag,
      image_urls: [],
      default_platforms: [],
      usage_count: 0,
      created_at: new Date().toISOString(),
    })
    if (!error) {
      setSavedId(t.id)
      setTimeout(() => setSavedId(null), 1400)
    }
  }

  const generateSmart = async () => {
    if (!genText.trim() || genText.trim().length < 5) {
      setGenError('Enter at least 5 characters describing your event.')
      return
    }
    setGenLoading(true)
    setGenError('')
    setGenResult(null)
    try {
      const res = await fetch('/api/social/ai-hashtags-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: genText,
          metro: metro || undefined,
          category: category || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.hashtags) {
        setGenResult({ hashtags: data.hashtags, reasoning: data.reasoning || '' })
      } else {
        setGenError(data.error || 'Failed to generate hashtags')
      }
    } catch (err: any) {
      setGenError(err.message || 'Network error')
    }
    setGenLoading(false)
  }

  const copyPill = async (tag: string) => {
    await navigator.clipboard.writeText(tag)
    setGenCopied(tag)
    setTimeout(() => setGenCopied(null), 1200)
  }

  const copyAllGenerated = async () => {
    if (!genResult) return
    await navigator.clipboard.writeText(genResult.hashtags.join(' '))
    setGenCopied('__all__')
    setTimeout(() => setGenCopied(null), 1400)
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'trending', label: 'Trending Now' },
    { key: 'metro', label: 'By Metro' },
    { key: 'category', label: 'By Category' },
    { key: 'search', label: 'Search' },
  ]

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <Navbar />

      <section className="relative border-b border-white/5 bg-gradient-to-b from-[#0F0D1A] to-[#070510]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-3 mb-3">
            <Hash size={22} style={{ color: '#E8970A' }} />
            <span
              className="text-sm uppercase tracking-wider"
              style={{ color: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Publisher Tools
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Hashtag <span style={{ color: '#E8970A' }}>Intelligence</span>
          </h1>
          <p
            className="text-lg text-gray-400 max-w-2xl"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Discover which hashtags actually drive engagement for Indian cultural events across
            the US.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                tab === t.key
                  ? 'bg-[#E8970A] text-black font-semibold'
                  : 'bg-[#0F0D1A] border border-[#1A1726] text-gray-300 hover:border-[#E8970A]/50'
              }`}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Metro</label>
            <select
              value={metro}
              onChange={(e) => setMetro(e.target.value)}
              className="w-full bg-[#070510] border border-[#1A1726] rounded-lg px-3 py-2 text-sm text-white"
            >
              {METROS.map((m) => (
                <option key={m} value={m}>
                  {m ? m.replace('_', ' ') : 'All metros'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#070510] border border-[#1A1726] rounded-lg px-3 py-2 text-sm text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c || 'All categories'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sort by</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full bg-[#070510] border border-[#1A1726] rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="effectiveness">Effectiveness</option>
              <option value="trending">Trending first</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
          {tab === 'search' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Search</label>
              <div className="relative">
                <SearchIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find hashtag..."
                  className="w-full bg-[#070510] border border-[#1A1726] rounded-lg pl-9 pr-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading hashtags...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
            No hashtags match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {filtered.map((t) => {
              const score = Number(t.effectiveness_score || 0)
              return (
                <div
                  key={t.id}
                  className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-5 hover:border-[#E8970A]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="text-lg font-semibold text-white break-all"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {t.hashtag}
                    </div>
                    {t.is_trending && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#E8970A]/15 text-[#E8970A] uppercase tracking-wide">
                        <TrendingUp size={11} /> Trending
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Effectiveness</span>
                      <span>{score.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full h-2 bg-[#1A1726] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          background: 'linear-gradient(90deg, #E8970A, #F5B547)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-4">
                    {t.category && (
                      <span className="px-2 py-1 rounded-full bg-[#1A1726] text-gray-300">
                        {t.category}
                      </span>
                    )}
                    {t.metro && (
                      <span className="px-2 py-1 rounded-full bg-[#1A1726] text-gray-300">
                        {t.metro.replace('_', ' ')}
                      </span>
                    )}
                    <span className="ml-auto">{t.usage_count || 0} uses</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copy(t.hashtag, t.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#1A1726] text-sm text-white hover:bg-[#252036] transition-colors"
                    >
                      {copiedId === t.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === t.id ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => saveToTemplate(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[#E8970A]/40 text-sm text-[#E8970A] hover:bg-[#E8970A]/10 transition-colors"
                    >
                      {savedId === t.id ? <Check size={14} /> : <Bookmark size={14} />}
                      {savedId === t.id ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* AI generator */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0F0D1A] to-[#140F20] border border-[#E8970A]/20 p-6 md:p-8 mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} style={{ color: '#E8970A' }} />
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Generate Hashtags for My Event
            </h2>
          </div>
          <p
            className="text-sm text-gray-400 mb-4"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Describe your event and we will pick the best hashtags, using the metro and category
            filters above as context.
          </p>

          <textarea
            value={genText}
            onChange={(e) => setGenText(e.target.value)}
            placeholder="e.g. Diwali gala with live Bollywood music and dance at San Jose Convention Center"
            rows={3}
            className="w-full bg-[#070510] border border-[#1A1726] rounded-lg px-4 py-3 text-sm text-white mb-3 focus:outline-none focus:border-[#E8970A]/50"
          />

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={generateSmart}
              disabled={genLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E8970A] text-black font-semibold text-sm hover:bg-[#F5B547] disabled:opacity-50 transition-colors"
            >
              <Sparkles size={16} />
              {genLoading ? 'Generating...' : 'Generate'}
            </button>
            {genError && <span className="text-sm text-red-400">{genError}</span>}
          </div>

          {genResult && (
            <div>
              {genResult.reasoning && (
                <p className="text-sm text-gray-400 italic mb-3">{genResult.reasoning}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {genResult.hashtags.map((h) => (
                  <button
                    key={h}
                    onClick={() => copyPill(h)}
                    className="px-3 py-1.5 rounded-full bg-[#1A1726] hover:bg-[#E8970A]/20 text-sm text-white border border-[#1A1726] hover:border-[#E8970A]/50 transition-colors inline-flex items-center gap-1"
                  >
                    {genCopied === h ? <Check size={12} /> : <Copy size={12} />}
                    {h}
                  </button>
                ))}
              </div>
              <button
                onClick={copyAllGenerated}
                className="text-xs text-[#E8970A] hover:underline"
              >
                {genCopied === '__all__' ? 'Copied all!' : 'Copy all hashtags'}
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
