'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import type { PostRun } from '@/lib/social-types'
import {
  PenSquare,
  CalendarClock,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  FileText,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Hash,
  Target,
  Repeat,
  FlaskConical,
  ShieldCheck,
  Lightbulb,
  Palette,
  Link2,
  Briefcase,
  Layers,
} from 'lucide-react'

interface Stats {
  connectedAccounts: number
  scheduledPosts: number
  publishedThisMonth: number
  failedPosts: number
}

export default function SocialHubPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    connectedAccounts: 0,
    scheduledPosts: 0,
    publishedThisMonth: 0,
    failedPosts: 0,
  })
  const [recentRuns, setRecentRuns] = useState<PostRun[]>([])

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [accountsRes, scheduledRes, publishedRes, failedRes, runsRes] = await Promise.all([
        supabase
          .from('social_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('scheduled_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'scheduled'),
        supabase
          .from('post_runs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['success', 'mock'])
          .gte('attempted_at', startOfMonth.toISOString()),
        supabase
          .from('post_runs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'failed'),
        supabase
          .from('post_runs')
          .select('*')
          .eq('user_id', user.id)
          .order('attempted_at', { ascending: false })
          .limit(10),
      ])

      setStats({
        connectedAccounts: accountsRes.count || 0,
        scheduledPosts: scheduledRes.count || 0,
        publishedThisMonth: publishedRes.count || 0,
        failedPosts: failedRes.count || 0,
      })
      setRecentRuns((runsRes.data as PostRun[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    {
      label: 'Connected Accounts',
      value: stats.connectedAccounts,
      icon: Users,
      color: '#E8970A',
    },
    {
      label: 'Scheduled Posts',
      value: stats.scheduledPosts,
      icon: CalendarClock,
      color: '#1877F2',
    },
    {
      label: 'Published This Month',
      value: stats.publishedThisMonth,
      icon: CheckCircle2,
      color: '#138808',
    },
    {
      label: 'Failed Posts',
      value: stats.failedPosts,
      icon: XCircle,
      color: '#E4405F',
    },
  ]

  const actions = [
    {
      href: '/social/compose',
      label: 'Compose New Post',
      desc: 'Create and schedule a new social post',
      icon: PenSquare,
    },
    {
      href: '/social/queue',
      label: 'View Schedule',
      desc: 'See upcoming and recurring posts',
      icon: CalendarClock,
    },
    {
      href: '/social/accounts',
      label: 'Manage Accounts',
      desc: 'Connect and manage social accounts',
      icon: Users,
    },
    {
      href: '/social/bulk',
      label: 'Bulk Upload',
      desc: 'Upload many scheduled posts at once via CSV',
      icon: Upload,
    },
    {
      href: '/social/templates',
      label: 'Templates',
      desc: 'Reusable content templates for quick composing',
      icon: FileText,
    },
    {
      href: '/social/voice',
      label: 'AI Voice',
      desc: 'Train AI to write in your unique brand voice',
      icon: Sparkles,
    },
    {
      href: '/social/image-studio',
      label: 'Image Studio',
      desc: 'Create stunning post images with text, frames, and filters',
      icon: ImageIcon,
    },
    {
      href: '/social/calendar',
      label: 'Cultural Calendar',
      desc: '🪔 Indian festivals & auto-suggested posts',
      icon: CalendarClock,
    },
    {
      href: '/social/countdown',
      label: 'Countdown Campaigns',
      desc: '🎯 Auto-schedule countdown posts for events',
      icon: Target,
    },
    {
      href: '/social/hashtags',
      label: 'Hashtag Intel',
      desc: 'Trending hashtags & AI suggestions',
      icon: Hash,
    },
    {
      href: '/social/best-times',
      label: 'Best Posting Times',
      desc: 'When to post for max engagement',
      icon: Clock,
    },
    {
      href: '/social/evergreen',
      label: 'Evergreen Content',
      desc: 'Auto-recycle your best posts',
      icon: Repeat,
    },
    {
      href: '/social/ab-tests',
      label: 'A/B Tests',
      desc: 'Test variations and pick winners',
      icon: FlaskConical,
    },
    {
      href: '/social/approvals',
      label: 'Approvals',
      desc: 'Review and approve team posts',
      icon: ShieldCheck,
    },
    {
      href: '/social/ideas',
      label: 'Idea Inbox',
      desc: '💡 Capture content ideas without scheduling',
      icon: Lightbulb,
    },
    {
      href: '/social/hashtag-groups',
      label: 'Hashtag Groups',
      desc: 'Save and reuse hashtag sets',
      icon: Layers,
    },
    {
      href: '/social/brand',
      label: 'Brand Assets',
      desc: 'Logos, colors, watermarks, signatures',
      icon: Palette,
    },
    {
      href: '/social/bio',
      label: 'Link in Bio',
      desc: 'Create your shareable bio page',
      icon: Link2,
    },
    {
      href: '/social/workspaces',
      label: 'Workspaces',
      desc: 'Manage multiple brands in separate spaces',
      icon: Briefcase,
    },
    {
      href: '/social/analytics',
      label: 'View Analytics',
      desc: 'Performance insights across all platforms',
      icon: BarChart3,
    },
  ]

  const statusIcon = (status: string) => {
    if (status === 'success' || status === 'mock')
      return <CheckCircle2 size={16} className="text-green-400" />
    if (status === 'failed') return <XCircle size={16} className="text-red-400" />
    return <Clock size={16} className="text-yellow-400" />
  }

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-[#0F0D1A] to-[#070510]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-3">
            <Share2 size={24} style={{ color: '#E8970A' }} />
            <span
              className="text-sm uppercase tracking-wider"
              style={{ color: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Publisher Tools
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Social Media <span style={{ color: '#E8970A' }}>Manager</span>
          </h1>
          <p
            className="text-lg text-gray-400 max-w-2xl"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Compose, schedule, and publish across all your social platforms from one dashboard.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Icon size={20} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <div
                      className="text-3xl font-bold mb-1"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-sm text-gray-400"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick actions */}
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {actions.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="group rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 hover:border-[#E8970A]/50 transition-colors"
                  >
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: '#E8970A20' }}
                    >
                      <Icon size={22} style={{ color: '#E8970A' }} />
                    </div>
                    <div
                      className="text-lg font-semibold mb-1 group-hover:text-[#E8970A] transition-colors"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {a.label}
                    </div>
                    <div
                      className="text-sm text-gray-400"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {a.desc}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Recent activity */}
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Recent Activity
            </h2>
            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] overflow-hidden">
              {recentRuns.length === 0 ? (
                <div
                  className="text-center py-16 text-gray-400"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  No activity yet. Compose your first post to get started.
                </div>
              ) : (
                <ul className="divide-y divide-[#1A1726]">
                  {recentRuns.map((run) => (
                    <li
                      key={run.id}
                      className="flex items-center gap-4 px-6 py-4"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {statusIcon(run.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white capitalize">
                          {run.platform} — {run.status}
                        </div>
                        {run.error_message && (
                          <div className="text-xs text-red-400 truncate">{run.error_message}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(run.attempted_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
