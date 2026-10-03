'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Clock,
} from 'lucide-react'

type DateRange = '7' | '30' | '90' | 'all'

interface PlatformStat {
  platform: string
  posts: number
  reach: number
  engagement: number
}

interface TopPost {
  id: string
  snippet: string
  platforms: string[]
  engagement: number
}

const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube']
const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Deterministic demo data generator
function buildDemoData(rangeDays: number) {
  const days = rangeDays === 0 ? 120 : rangeDays
  const postsPerDay: { date: string; count: number }[] = []
  let totalPosts = 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const count = Math.max(0, Math.round(3 + Math.sin(i / 3) * 2 + ((i * 7) % 4) - 1))
    totalPosts += count
    postsPerDay.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count })
  }

  const totalImpressions = totalPosts * 1240 + 8420
  const totalLikes = Math.round(totalImpressions * 0.064)
  const totalComments = Math.round(totalImpressions * 0.011)
  const totalShares = Math.round(totalImpressions * 0.008)
  const totalEngagement = totalLikes + totalComments + totalShares
  const engagementRate = totalImpressions ? (totalEngagement / totalImpressions) * 100 : 0

  const platformStats: PlatformStat[] = PLATFORMS.map((p, idx) => ({
    platform: p,
    posts: Math.round(totalPosts * [0.3, 0.25, 0.2, 0.15, 0.1][idx]),
    reach: Math.round(totalImpressions * [0.35, 0.28, 0.15, 0.12, 0.1][idx]),
    engagement: Math.round(totalEngagement * [0.4, 0.25, 0.15, 0.12, 0.08][idx]),
  }))

  const topPosts: TopPost[] = [
    { id: '1', snippet: 'Diwali celebration at Cubbon Park - join us for an unforgettable evening of lights and music', platforms: ['instagram', 'facebook'], engagement: 4820 },
    { id: '2', snippet: 'Classical Carnatic concert feat. Sudha Raghunathan - tickets now live', platforms: ['instagram', 'twitter'], engagement: 3640 },
    { id: '3', snippet: 'Holi festival bash 2026 - DJ, rain dance, organic colors', platforms: ['facebook', 'instagram'], engagement: 3210 },
    { id: '4', snippet: 'Kathak workshop with Guru Shovana Narayan - weekend intensive', platforms: ['instagram'], engagement: 2890 },
    { id: '5', snippet: 'Street food festival - 40 stalls from across India', platforms: ['facebook', 'twitter'], engagement: 2540 },
    { id: '6', snippet: 'Navratri garba nights - 9 days of dance and devotion', platforms: ['instagram', 'facebook'], engagement: 2310 },
    { id: '7', snippet: 'Indie band showcase at Hard Rock Cafe this Friday', platforms: ['twitter', 'instagram'], engagement: 1980 },
    { id: '8', snippet: 'Stand-up comedy night with Zakir Khan - limited seats', platforms: ['instagram'], engagement: 1720 },
    { id: '9', snippet: 'Yoga retreat in Rishikesh - early bird pricing ends soon', platforms: ['linkedin', 'facebook'], engagement: 1450 },
    { id: '10', snippet: 'Tech meetup: building for Bharat - speakers from top startups', platforms: ['linkedin', 'twitter'], engagement: 1290 },
  ]

  // heatmap 7x24 - higher values evenings and weekends
  const heatmap: number[][] = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const eveBoost = Math.max(0, 10 - Math.abs(hour - 19))
      const weekendBoost = day === 0 || day === 6 ? 4 : 0
      const noise = (day * 7 + hour * 3) % 5
      return eveBoost + weekendBoost + noise
    })
  )

  return {
    totalPosts,
    totalImpressions,
    totalEngagement,
    engagementRate,
    postsPerDay,
    platformStats,
    topPosts,
    heatmap,
  }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<DateRange>('30')

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setLoading(false)
    }
    load()
  }, [])

  const data = useMemo(() => {
    const days = range === 'all' ? 0 : parseInt(range, 10)
    return buildDemoData(days)
  }, [range])

  const maxPostsPerDay = Math.max(1, ...data.postsPerDay.map((d) => d.count))
  const maxPlatformEng = Math.max(1, ...data.platformStats.map((p) => p.engagement))
  const maxHeat = Math.max(...data.heatmap.flat())

  const statCards = [
    { label: 'Posts Published', value: data.totalPosts.toLocaleString(), icon: BarChart3, color: '#E8970A' },
    { label: 'Total Impressions', value: data.totalImpressions.toLocaleString(), icon: Eye, color: '#1877F2' },
    { label: 'Total Engagement', value: data.totalEngagement.toLocaleString(), icon: Heart, color: '#E4405F' },
    { label: 'Avg Engagement Rate', value: `${data.engagementRate.toFixed(2)}%`, icon: TrendingUp, color: '#138808' },
  ]

  const ranges: { key: DateRange; label: string }[] = [
    { key: '7', label: '7 days' },
    { key: '30', label: '30 days' },
    { key: '90', label: '90 days' },
    { key: 'all', label: 'All time' },
  ]

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <Navbar />

      <section className="relative border-b border-white/5 bg-gradient-to-b from-[#0F0D1A] to-[#070510]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 size={24} style={{ color: '#E8970A' }} />
                <span className="text-sm uppercase tracking-wider" style={{ color: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}>
                  Analytics
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Social <span style={{ color: '#E8970A' }}>Analytics</span>
              </h1>
              <p className="text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Track performance across all your connected platforms.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ranges.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    range === r.key
                      ? 'bg-[#E8970A] border-[#E8970A] text-black font-semibold'
                      : 'bg-[#0F0D1A] border-[#1A1726] text-gray-300 hover:border-[#E8970A]/50'
                  }`}
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Demo banner */}
            <div className="mb-8 rounded-xl border border-[#E8970A]/30 bg-[#E8970A]/10 px-5 py-4 text-sm text-[#F5C271]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Demo data shown. Real analytics will be collected when platform integrations are enabled.
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {statCards.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}20` }}>
                      <Icon size={20} style={{ color: s.color }} />
                    </div>
                    <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {s.value}
                    </div>
                    <div className="text-sm text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {s.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Posts per day chart */}
            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Calendar size={18} style={{ color: '#E8970A' }} />
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Posts Published Per Day
                </h3>
              </div>
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {data.postsPerDay.slice(-60).map((d, i) => (
                  <div key={i} className="flex-1 min-w-[6px] flex flex-col items-center justify-end group relative">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-[#E8970A]/40 to-[#E8970A] hover:from-[#E8970A]/60 hover:to-[#FFB84D] transition-all"
                      style={{ height: `${(d.count / maxPostsPerDay) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                      title={`${d.date}: ${d.count} posts`}
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Showing last {Math.min(60, data.postsPerDay.length)} days
              </div>
            </div>

            {/* Engagement by platform */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp size={18} style={{ color: '#E8970A' }} />
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Engagement by Platform
                  </h3>
                </div>
                <div className="space-y-4">
                  {data.platformStats.map((p) => (
                    <div key={p.platform}>
                      <div className="flex items-center justify-between mb-1 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        <span className="capitalize text-gray-300">{p.platform}</span>
                        <span className="text-gray-400">{p.engagement.toLocaleString()}</span>
                      </div>
                      <div className="h-3 bg-[#1A1726] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(p.engagement / maxPlatformEng) * 100}%`,
                            backgroundColor: PLATFORM_COLORS[p.platform],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap */}
              <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Clock size={18} style={{ color: '#E8970A' }} />
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Best Posting Times
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <div className="inline-block">
                    <div className="flex gap-[2px] mb-[2px] pl-8">
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={h} className="w-3 text-[8px] text-gray-500 text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {h % 3 === 0 ? h : ''}
                        </div>
                      ))}
                    </div>
                    {data.heatmap.map((row, d) => (
                      <div key={d} className="flex gap-[2px] mb-[2px] items-center">
                        <div className="w-8 text-[10px] text-gray-500" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {DAYS[d]}
                        </div>
                        {row.map((val, h) => {
                          const intensity = val / maxHeat
                          return (
                            <div
                              key={h}
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: `rgba(232, 151, 10, ${0.08 + intensity * 0.92})` }}
                              title={`${DAYS[d]} ${h}:00 — engagement score ${val}`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Brighter cells indicate higher engagement.
                </div>
              </div>
            </div>

            {/* Top performing posts */}
            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 mb-6">
              <h3 className="text-lg font-semibold mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>
                Top Performing Posts
              </h3>
              <ul className="divide-y divide-[#1A1726]">
                {data.topPosts.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-4 py-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    <div className="w-7 text-center text-sm font-semibold text-[#E8970A]">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{p.snippet}</div>
                      <div className="flex gap-2 mt-1">
                        {p.platforms.map((pl) => (
                          <span key={pl} className="text-[10px] uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PLATFORM_COLORS[pl]}20`, color: PLATFORM_COLORS[pl] }}>
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                      <Heart size={14} className="text-[#E4405F]" />
                      {p.engagement.toLocaleString()}
                    </div>
                    <Link href="/social/queue" className="text-xs text-[#E8970A] hover:underline whitespace-nowrap">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform breakdown */}
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Platform Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
              {data.platformStats.map((p) => (
                <div key={p.platform} className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.platform] }} />
                    <div className="text-sm capitalize text-gray-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {p.platform}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Posts</span>
                      <span className="text-white">{p.posts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reach</span>
                      <span className="text-white">{p.reach.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Engagement</span>
                      <span className="text-white">{p.engagement.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="rounded-xl bg-gradient-to-br from-[#E8970A]/10 to-[#0F0D1A] border border-[#E8970A]/30 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} style={{ color: '#E8970A' }} />
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Insights
                </h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <li className="flex gap-3">
                  <Clock size={16} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                  Your audience engages most on <strong className="text-white">Saturdays at 7 PM</strong>. Consider scheduling high-priority posts for this window.
                </li>
                <li className="flex gap-3">
                  <TrendingUp size={16} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                  <span>Diwali-themed posts perform <strong className="text-white">40% better</strong> than your average. Festival content is a clear winner.</span>
                </li>
                <li className="flex gap-3">
                  <MessageCircle size={16} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                  Instagram drives your highest engagement rate. Prioritize vertical imagery and Reels for best results.
                </li>
                <li className="flex gap-3">
                  <Share2 size={16} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                  Posts with 3+ hashtags see a <strong className="text-white">22% lift</strong> in reach versus posts with none.
                </li>
              </ul>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
