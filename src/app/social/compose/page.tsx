'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { type SocialAccount, type ScheduledPost } from '@/lib/social-types'
import MultiImageUpload from '@/components/MultiImageUpload'
import StoryWeaver from '@/components/StoryWeaver'
import {
  Image as ImageIcon,
  Link2,
  Hash,
  Calendar,
  Clock,
  Repeat,
  Send,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Wand2,
} from 'lucide-react'

type ScheduleMode = 'now' | 'once' | 'recurring'
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom'
type EndCondition = 'date' | 'count' | 'forever'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PLATFORM_META: Record<
  string,
  { color: string; limit: number; label: string }
> = {
  twitter: { color: '#1DA1F2', limit: 280, label: 'Twitter' },
  facebook: { color: '#1877F2', limit: 63206, label: 'Facebook' },
  instagram: { color: '#E1306C', limit: 2200, label: 'Instagram' },
  linkedin: { color: '#0A66C2', limit: 3000, label: 'LinkedIn' },
}

export default function ComposePostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070510] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#E8970A]" />
        </div>
      }
    >
      <ComposePostPageInner />
    </Suspense>
  )
}

function ComposePostPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [profileName, setProfileName] = useState<string>('')
  const [accounts, setAccounts] = useState<SocialAccount[]>([])

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [contentVariations, setContentVariations] = useState<string[]>([])
  const [contentStrategy, setContentStrategy] = useState<'fixed' | 'rotate' | 'random'>('fixed')
  const [imageStrategy, setImageStrategy] = useState<'first' | 'rotate' | 'random' | 'collage'>('first')
  const [tone, setTone] = useState('vibrant')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showVariations, setShowVariations] = useState(false)

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [showOverrides, setShowOverrides] = useState(false)
  const [storyWeaverMode, setStoryWeaverMode] = useState(false)

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now')
  const [scheduledFor, setScheduledFor] = useState<string>('')

  // Recurrence
  const [pattern, setPattern] = useState<RecurrencePattern>('weekly')
  const [interval, setInterval] = useState<number>(1)
  const [weekDays, setWeekDays] = useState<number[]>([1])
  const [times, setTimes] = useState<string[]>(['09:00'])
  const [endCondition, setEndCondition] = useState<EndCondition>('forever')
  const [endDate, setEndDate] = useState<string>('')
  const [endCount, setEndCount] = useState<number>(10)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      if (profile) setProfileName((profile as { name: string }).name || '')

      const { data: accts } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected')

      if (accts) setAccounts(accts as SocialAccount[])

      // Load from template if templateId provided
      const templateId = searchParams.get('templateId')
      if (templateId) {
        const { data: tpl } = await supabase
          .from('post_templates')
          .select('*')
          .eq('id', templateId)
          .eq('user_id', user.id)
          .single()
        if (tpl) {
          const t = tpl as {
            name?: string
            content?: string
            hashtags?: string
            default_tone?: string
            default_platforms?: string[]
            usage_count?: number
          }
          setTitle(t.name || '')
          setContent(t.content || '')
          setHashtags(t.hashtags || '')
          if (t.default_tone) setTone(t.default_tone)
          supabase
            .from('post_templates')
            .update({
              usage_count: (t.usage_count || 0) + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq('id', templateId)
            .then(() => {})
        }
      }

      setLoading(false)
    }
    init()
  }, [])

  const selectedAccounts = useMemo(
    () => accounts.filter((a) => selectedAccountIds.includes(a.id)),
    [accounts, selectedAccountIds]
  )

  const selectedPlatforms = useMemo(
    () => Array.from(new Set(selectedAccounts.map((a) => a.platform))),
    [selectedAccounts]
  )

  const mostRestrictiveLimit = useMemo(() => {
    if (selectedPlatforms.length === 0) return null
    let min = Infinity
    let plat = ''
    for (const p of selectedPlatforms) {
      const meta = PLATFORM_META[p]
      if (meta && meta.limit < min) {
        min = meta.limit
        plat = meta.label
      }
    }
    return min === Infinity ? null : { limit: min, platform: plat }
  }, [selectedPlatforms])

  const fullContent = (base: string) => {
    const tags = hashtags.trim()
    return tags ? `${base}${base.endsWith('\n') ? '' : '\n\n'}${tags}` : base
  }

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleFile = (file: File | undefined | null) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return imageUrl
    const filePath = `social/${userId}/${Date.now()}-${imageFile.name}`
    const { error } = await supabase.storage
      .from('post-images')
      .upload(filePath, imageFile)
    if (error) {
      alert('Image upload failed: ' + error.message)
      return ''
    }
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)
    return urlData.publicUrl
  }

  const calculateNextRun = (): string => {
    const now = new Date()
    if (scheduleMode === 'now') return now.toISOString()
    if (scheduleMode === 'once') {
      return scheduledFor ? new Date(scheduledFor).toISOString() : now.toISOString()
    }
    // recurring — compute first occurrence
    const [hh, mm] = (times[0] || '09:00').split(':').map(Number)
    const next = new Date()
    next.setHours(hh, mm, 0, 0)

    if (pattern === 'weekly' && weekDays.length > 0) {
      const today = next.getDay()
      let daysToAdd = -1
      for (let i = 0; i < 14; i++) {
        const candidate = (today + i) % 7
        if (weekDays.includes(candidate)) {
          const test = new Date(next)
          test.setDate(next.getDate() + i)
          if (test.getTime() > Date.now()) {
            daysToAdd = i
            break
          }
        }
      }
      if (daysToAdd >= 0) next.setDate(next.getDate() + daysToAdd)
    } else if (pattern === 'daily') {
      if (next.getTime() <= Date.now()) next.setDate(next.getDate() + interval)
    } else if (pattern === 'monthly') {
      if (next.getTime() <= Date.now()) next.setMonth(next.getMonth() + interval)
    }
    return next.toISOString()
  }

  const recurrencePreview = useMemo(() => {
    if (scheduleMode !== 'recurring') return ''
    const timeStr = times
      .map((t) => {
        const [h, m] = t.split(':').map(Number)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
      })
      .join(' and ')

    let freq = ''
    if (pattern === 'daily') freq = interval === 1 ? 'every day' : `every ${interval} days`
    else if (pattern === 'weekly') {
      const days = weekDays.map((d) => DAYS_OF_WEEK[d]).join(', ')
      freq = `every ${days || 'week'}`
    } else if (pattern === 'monthly') freq = interval === 1 ? 'every month' : `every ${interval} months`
    else freq = 'on a custom schedule'

    let end = ''
    if (endCondition === 'date' && endDate) end = ` until ${endDate}`
    else if (endCondition === 'count') end = ` for ${endCount} times`

    return `This post will be published ${freq} at ${timeStr}${end}.`
  }, [scheduleMode, pattern, interval, weekDays, times, endCondition, endDate, endCount])

  async function generateVariations() {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/social/ai-reword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, tone, count: 5, hashtags }),
      })
      const data = await res.json()
      if (data.variations) {
        setContentVariations(data.variations)
        setShowVariations(true)
      } else {
        setAiError(data.error || 'Failed to generate variations')
      }
    } catch (err: any) {
      setAiError(err.message)
    }
    setAiLoading(false)
  }

  async function generateHashtags() {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/social/ai-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      })
      const data = await res.json()
      if (data.hashtags) {
        setHashtags(data.hashtags.join(' '))
      } else {
        setAiError(data.error || 'Failed to generate hashtags')
      }
    } catch (err: any) {
      setAiError(err.message)
    }
    setAiLoading(false)
  }

  const validate = (): string | null => {
    if (!content.trim()) return 'Content is required.'
    if (selectedAccountIds.length === 0) return 'Please select at least one platform.'
    if (scheduleMode === 'once' && !scheduledFor) return 'Please pick a date and time.'
    return null
  }

  const buildRow = (status: 'draft' | 'scheduled'): Partial<ScheduledPost> => {
    // Translate selected account IDs into the unique platforms list
    const selectedPlatformsList = Array.from(new Set(
      accounts.filter(a => selectedAccountIds.includes(a.id)).map(a => a.platform)
    ))

    return {
      user_id: userId,
      title: title || '',
      content,
      hashtags: hashtags || '',
      link_url: linkUrl || '',
      image_url: (imageUrls[0] || imageUrl) || '',
      image_urls: imageUrls,
      content_variations: contentVariations,
      content_strategy: contentStrategy,
      image_strategy: imageStrategy,
      tone,
      platforms: selectedPlatformsList,
      platform_content: Object.keys(overrides).length > 0 ? overrides : {},
      schedule_type: scheduleMode === 'now' ? 'now' : scheduleMode === 'recurring' ? 'recurring' : 'once',
      scheduled_for: scheduleMode === 'once' ? new Date(scheduledFor).toISOString() : null,
      recurrence_pattern: scheduleMode === 'recurring' ? pattern : null,
      recurrence_interval: scheduleMode === 'recurring' ? interval : 1,
      recurrence_days_of_week: scheduleMode === 'recurring' && pattern === 'weekly' ? weekDays : null,
      recurrence_times_of_day: scheduleMode === 'recurring' ? times : null,
      recurrence_end_date: scheduleMode === 'recurring' && endCondition === 'date' ? endDate : null,
      recurrence_max_runs: scheduleMode === 'recurring' && endCondition === 'count' ? endCount : null,
      next_run_at: status === 'scheduled' ? calculateNextRun() : null,
      status,
    } as Partial<ScheduledPost>
  }

  const handleSave = async (status: 'draft' | 'scheduled') => {
    if (status === 'scheduled') {
      const err = validate()
      if (err) {
        alert(err)
        return
      }
    } else if (!content.trim()) {
      alert('Content is required.')
      return
    }
    setSubmitting(true)

    let finalImageUrl = imageUrl
    if (imageFile) {
      finalImageUrl = await uploadImage()
      setImageUrl(finalImageUrl)
    }

    const row = {
      ...buildRow(status),
      image_url: (imageUrls[0] || finalImageUrl) || null,
    }

    const { error } = await supabase.from('scheduled_posts').insert(row)
    setSubmitting(false)

    if (error) {
      alert('Failed to save post: ' + error.message)
      return
    }
    router.push('/social/queue')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070510] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#E8970A]" />
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A] transition-colors'
  const labelClass = 'block text-sm text-gray-400 mb-1.5'

  const charCount = content.length
  const overLimit = mostRestrictiveLimit && charCount > mostRestrictiveLimit.limit

  return (
    <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#E8970A' }}
          >
            Compose Post
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Create a post and schedule it across your social channels
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Composer */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className={labelClass}>Title (internal)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="Internal label for tracking"
              />
            </div>

            {/* AI Assist */}
            <div className="rounded-xl border border-[#E8970A]/30 bg-[#E8970A]/5 p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-[#E8970A]" />
                <h3 className="font-semibold text-white">AI Content Magic</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#0F0D1A] border border-[#1A1726] text-gray-300"
                >
                  <option value="vibrant">Vibrant</option>
                  <option value="young">Young & Trendy</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="humorous">Humorous</option>
                  <option value="elegant">Elegant</option>
                  <option value="cultural">Cultural</option>
                  <option value="festive">Festive</option>
                  <option value="urgent">Urgent / FOMO</option>
                </select>
                <button
                  type="button"
                  onClick={generateVariations}
                  disabled={!content.trim() || aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8970A] text-black hover:opacity-90 disabled:opacity-40"
                >
                  <Wand2 size={14} />
                  {aiLoading ? 'Generating...' : 'Generate 5 Variations'}
                </button>
                <button
                  type="button"
                  onClick={generateHashtags}
                  disabled={!content.trim() || aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E8970A]/50 text-[#E8970A] hover:bg-[#E8970A]/10 disabled:opacity-40"
                >
                  <Hash size={14} />
                  Suggest Hashtags
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Generate fresh variations of your text. Each scheduled post can use a different version automatically.
              </p>
              {aiError && <p className="mt-2 text-xs text-red-400">{aiError}</p>}
            </div>

            {contentVariations.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">{contentVariations.length} Variations</h4>
                  <button
                    type="button"
                    onClick={() => setContentVariations([])}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    Clear all
                  </button>
                </div>
                {contentVariations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-sm text-gray-300 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 whitespace-pre-wrap">{v}</div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setContent(v)}
                          className="text-xs text-[#E8970A] hover:underline"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setContentVariations(contentVariations.filter((_, j) => j !== i))
                          }
                          className="text-gray-500 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Story Weaver Mode */}
            <div className="bg-[#0f0820] border border-white/10 rounded-xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Wand2 size={16} className="text-[#E8970A]" />
                  <span className="text-sm font-semibold text-white">
                    Story Weaver Mode
                  </span>
                  <span className="text-xs text-gray-400">
                    Write once, auto-generate native versions per platform
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStoryWeaverMode((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition ${
                    storyWeaverMode ? 'bg-[#E8970A]' : 'bg-white/10'
                  }`}
                  aria-pressed={storyWeaverMode}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      storyWeaverMode ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>
              {storyWeaverMode && (
                <div className="mt-4">
                  <StoryWeaver
                    initialContent={content}
                    platforms={selectedPlatforms}
                    onVersionsGenerated={(versions) => {
                      setOverrides((prev) => ({ ...prev, ...versions }))
                      setShowOverrides(true)
                    }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-gray-400">Content *</label>
                {mostRestrictiveLimit ? (
                  <span className={`text-xs ${overLimit ? 'text-red-400' : 'text-gray-500'}`}>
                    {charCount} / {mostRestrictiveLimit.limit} — {mostRestrictiveLimit.platform} limit
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">{charCount} chars</span>
                )}
              </div>
              <textarea
                required
                rows={Math.max(5, Math.min(15, Math.ceil(content.length / 60) + 3))}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={inputClass}
                placeholder="What's happening? Share your event, milestone, or update..."
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className={labelClass}>
                <Hash size={12} className="inline mr-1" />
                Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className={inputClass}
                placeholder="#bollywood #diwali2026 #bayareaevents"
              />
              <p className="text-xs text-gray-600 mt-1">
                Separate with spaces. Will be appended to all platforms.
              </p>
            </div>

            {/* Images */}
            <div>
              <label className={labelClass}>
                <ImageIcon size={12} className="inline mr-1" />
                Images
              </label>
              {userId && (
                <MultiImageUpload
                  userId={userId}
                  initialImages={imageUrls}
                  maxImages={10}
                  onChange={setImageUrls}
                />
              )}
            </div>

            {/* Link URL */}
            <div>
              <label className={labelClass}>
                <Link2 size={12} className="inline mr-1" />
                Link URL
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className={inputClass}
                placeholder="https://eventbrite.com/..."
              />
              <p className="text-xs text-gray-600 mt-1">
                Ticket link, event page, or any URL to include
              </p>
            </div>

            {/* Target Platforms */}
            <div>
              <label className={labelClass}>Target Platforms *</label>
              {accounts.length === 0 ? (
                <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-lg p-5 text-center text-sm text-gray-400">
                  No accounts connected.{' '}
                  <a href="/social/accounts" className="text-[#E8970A] hover:underline">
                    Connect accounts
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acct) => {
                    const meta = PLATFORM_META[acct.platform]
                    const isSelected = selectedAccountIds.includes(acct.id)
                    return (
                      <label
                        key={acct.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[#E8970A] bg-[#E8970A]/5'
                            : 'border-[#1A1726] bg-[#0F0D1A] hover:border-[#1A1726]/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAccount(acct.id)}
                          className="accent-[#E8970A]"
                        />
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta?.color || '#888' }}
                        />
                        <span className="text-sm font-medium text-white">
                          {meta?.label || acct.platform}
                        </span>
                        <span className="text-xs text-gray-500">{acct.account_name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Per-platform overrides */}
            {selectedAccounts.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowOverrides(!showOverrides)}
                  className="text-sm text-[#E8970A] hover:underline"
                >
                  {showOverrides ? '− Hide' : '+ Customize'} per-platform content
                </button>
                {showOverrides && (
                  <div className="mt-3 space-y-3">
                    {selectedPlatforms.map((p) => {
                      const meta = PLATFORM_META[p]
                      return (
                        <div key={p}>
                          <label className={labelClass}>
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: meta?.color }}
                            />
                            {meta?.label} override
                          </label>
                          <textarea
                            rows={3}
                            value={overrides[p] || ''}
                            onChange={(e) =>
                              setOverrides({ ...overrides, [p]: e.target.value })
                            }
                            className={inputClass}
                            placeholder={`Leave blank to use main content (${meta?.limit} char limit)`}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Schedule */}
            <div>
              <label className={labelClass}>Schedule</label>
              <div className="space-y-2">
                {([
                  { val: 'now', icon: Send, label: 'Post Now' },
                  { val: 'once', icon: Calendar, label: 'Schedule for Later' },
                  { val: 'recurring', icon: Repeat, label: 'Recurring Schedule' },
                ] as const).map(({ val, icon: Icon, label }) => (
                  <label
                    key={val}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      scheduleMode === val
                        ? 'border-[#E8970A] bg-[#E8970A]/5'
                        : 'border-[#1A1726] bg-[#0F0D1A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === val}
                      onChange={() => setScheduleMode(val)}
                      className="accent-[#E8970A]"
                    />
                    <Icon size={16} className="text-gray-400" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>

              {scheduleMode === 'once' && (
                <div className="mt-3">
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              {scheduleMode === 'recurring' && (
                <div className="mt-4 p-4 bg-[#0F0D1A] border border-[#1A1726] rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Pattern</label>
                      <select
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value as RecurrencePattern)}
                        className={inputClass}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Every</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={interval}
                          onChange={(e) => setInterval(Number(e.target.value))}
                          className={inputClass}
                        />
                        <span className="text-sm text-gray-400 whitespace-nowrap">
                          {pattern === 'daily' ? 'days' : pattern === 'weekly' ? 'weeks' : 'months'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {pattern === 'weekly' && (
                    <div>
                      <label className={labelClass}>Days of week</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS_OF_WEEK.map((d, i) => {
                          const active = weekDays.includes(i)
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() =>
                                setWeekDays((prev) =>
                                  prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                                )
                              }
                              className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                                active
                                  ? 'bg-[#E8970A] text-black'
                                  : 'bg-[#070510] border border-[#1A1726] text-gray-400'
                              }`}
                            >
                              {d}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>
                      <Clock size={12} className="inline mr-1" />
                      Times of day
                    </label>
                    <div className="space-y-2">
                      {times.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={t}
                            onChange={(e) => {
                              const next = [...times]
                              next[i] = e.target.value
                              setTimes(next)
                            }}
                            className={inputClass}
                          />
                          {times.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTimes(times.filter((_, idx) => idx !== i))}
                              className="p-2 text-gray-400 hover:text-red-400"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTimes([...times, '15:00'])}
                        className="flex items-center gap-1 text-xs text-[#E8970A] hover:underline"
                      >
                        <Plus size={12} /> Add another time
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>End condition</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={endCondition === 'date'}
                          onChange={() => setEndCondition('date')}
                          className="accent-[#E8970A]"
                        />
                        <span className="text-sm text-gray-300">Run until</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          disabled={endCondition !== 'date'}
                          className={inputClass + ' flex-1 disabled:opacity-40'}
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={endCondition === 'count'}
                          onChange={() => setEndCondition('count')}
                          className="accent-[#E8970A]"
                        />
                        <span className="text-sm text-gray-300">Run</span>
                        <input
                          type="number"
                          min={1}
                          value={endCount}
                          onChange={(e) => setEndCount(Number(e.target.value))}
                          disabled={endCondition !== 'count'}
                          className={inputClass + ' w-24 disabled:opacity-40'}
                        />
                        <span className="text-sm text-gray-300">times</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={endCondition === 'forever'}
                          onChange={() => setEndCondition('forever')}
                          className="accent-[#E8970A]"
                        />
                        <span className="text-sm text-gray-300">Run forever</span>
                      </label>
                    </div>
                  </div>

                  {recurrencePreview && (
                    <div className="p-3 rounded-lg bg-[#E8970A]/10 border border-[#E8970A]/30 text-xs text-[#E8970A]">
                      {recurrencePreview}
                    </div>
                  )}

                  {contentVariations.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726]">
                      <h4 className="text-sm font-medium text-white mb-2">For each scheduled run:</h4>
                      <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contentStrategy"
                            value="fixed"
                            checked={contentStrategy === 'fixed'}
                            onChange={(e) => setContentStrategy(e.target.value as any)}
                            className="accent-[#E8970A]"
                          />
                          <span className="text-gray-300">Always use main content</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contentStrategy"
                            value="rotate"
                            checked={contentStrategy === 'rotate'}
                            onChange={(e) => setContentStrategy(e.target.value as any)}
                            className="accent-[#E8970A]"
                          />
                          <span className="text-gray-300">Rotate through variations</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contentStrategy"
                            value="random"
                            checked={contentStrategy === 'random'}
                            onChange={(e) => setContentStrategy(e.target.value as any)}
                            className="accent-[#E8970A]"
                          />
                          <span className="text-gray-300">Pick random variation each time</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {imageUrls.length > 1 && (
                    <div className="mt-4 p-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726]">
                      <h4 className="text-sm font-medium text-white mb-2">For each scheduled run, use:</h4>
                      <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="imageStrategy"
                            value="first"
                            checked={imageStrategy === 'first'}
                            onChange={(e) => setImageStrategy(e.target.value as any)}
                            className="accent-[#E8970A]"
                          />
                          <span className="text-gray-300">Always first image</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="imageStrategy"
                            value="rotate"
                            checked={imageStrategy === 'rotate'}
                            onChange={(e) => setImageStrategy(e.target.value as any)}
                            className="accent-[#E8970A]"
                          />
                          <span className="text-gray-300">Rotate through images</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="imageStrategy"
                            value="random"
                            checked={imageStrategy === 'random'}
                            onChange={(e) => setImageStrategy(e.target.value as any)}
                            className="accent-[#E8970A]"
                          />
                          <span className="text-gray-300">Random image each time</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="button"
                onClick={() => handleSave('scheduled')}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E8970A' }}
              >
                <Send size={16} />
                {submitting ? 'Saving...' : scheduleMode === 'now' ? 'Post Now' : 'Schedule Post'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm text-gray-300 border border-[#1A1726] hover:bg-white/5"
              >
                <Save size={16} />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => router.push('/social')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT — Live Preview */}
          <div className="space-y-5">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Live Preview
            </h2>

            {selectedPlatforms.length === 0 ? (
              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-10 text-center text-sm text-gray-500">
                Select one or more platforms to see a live preview.
              </div>
            ) : (
              selectedPlatforms.map((p) => {
                const meta = PLATFORM_META[p]
                const baseText = overrides[p] || content
                const text = fullContent(baseText)
                const limit = meta?.limit || 0
                const count = text.length
                const truncated = p === 'twitter' && count > 280 ? text.slice(0, 277) + '...' : text
                const handle = selectedAccounts.find((a) => a.platform === p)?.account_name || 'you'
                return (
                  <PreviewCard
                    key={p}
                    platform={p}
                    color={meta?.color || '#888'}
                    label={meta?.label || p}
                    name={profileName || 'IndianPrograms'}
                    handle={handle}
                    text={truncated}
                    image={imageUrls[0] || imagePreview || imageUrl}
                    extraImages={Math.max(0, imageUrls.length - 1)}
                    link={linkUrl}
                    count={count}
                    limit={limit}
                  />
                )
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function PreviewCard({
  platform,
  color,
  label,
  name,
  handle,
  text,
  image,
  extraImages = 0,
  link,
  count,
  limit,
}: {
  platform: string
  color: string
  label: string
  name: string
  handle: string
  text: string
  image: string
  extraImages?: number
  link: string
  count: number
  limit: number
}) {
  const over = count > limit
  const isTwitter = platform === 'twitter'
  const isFacebook = platform === 'facebook'
  const isInstagram = platform === 'instagram'
  const isLinkedIn = platform === 'linkedin'

  const bg = isTwitter ? '#15202B' : '#ffffff'
  const fg = isTwitter ? '#ffffff' : '#0F1419'
  const sub = isTwitter ? '#8899A6' : '#536471'

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: color + '40' }}>
      <div
        className="flex items-center justify-between px-4 py-2 text-xs font-medium"
        style={{ backgroundColor: color + '20', color }}
      >
        <span>{label} Preview</span>
        <span className={over ? 'text-red-400' : ''}>
          {count} / {limit}
        </span>
      </div>
      <div style={{ backgroundColor: bg, color: fg }} className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: color }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">{name}</span>
              <span className="text-xs" style={{ color: sub }}>
                @{handle}
              </span>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{text || 'Your post content will appear here...'}</p>
            {image && (
              <div
                className={`relative mt-3 overflow-hidden rounded-lg ${
                  isInstagram ? 'aspect-square' : 'aspect-video'
                }`}
                style={{ border: `1px solid ${sub}30` }}
              >
                <img src={image} alt="preview" className="w-full h-full object-cover" />
                {extraImages > 0 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs font-medium">
                    +{extraImages} more
                  </div>
                )}
              </div>
            )}
            {link && (
              <div
                className="mt-3 p-3 rounded-lg text-xs truncate"
                style={{ border: `1px solid ${sub}30`, color: sub }}
              >
                <Link2 size={12} className="inline mr-1" />
                {link}
              </div>
            )}
            {isLinkedIn && (
              <div className="mt-2 text-xs" style={{ color: sub }}>
                Promoted post - IndianPrograms
              </div>
            )}
            {isFacebook && (
              <div className="mt-2 text-xs" style={{ color: sub }}>
                Like - Comment - Share
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
