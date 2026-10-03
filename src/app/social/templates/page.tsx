'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  Search,
  X,
  Save,
} from 'lucide-react'

type Template = {
  id: string
  user_id: string
  name: string
  category: string | null
  description: string | null
  content: string
  hashtags: string | null
  image_urls: string[] | null
  default_tone: string | null
  default_platforms: string[] | null
  usage_count: number | null
  created_at: string
  updated_at: string | null
  last_used_at: string | null
}

const CATEGORIES = [
  'Promotion',
  'Announcement',
  'Educational',
  'Behind-the-scenes',
  'Testimonial',
  'FAQ',
  'Recap',
  'Other',
]

const TONES = ['vibrant', 'professional', 'casual', 'inspirational', 'playful', 'urgent']

const PLATFORMS = [
  { id: 'twitter', label: 'Twitter', color: '#1DA1F2' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Promotion: '#E8970A',
  Announcement: '#1877F2',
  Educational: '#138808',
  'Behind-the-scenes': '#9333EA',
  Testimonial: '#E4405F',
  FAQ: '#0A66C2',
  Recap: '#F59E0B',
  Other: '#6B7280',
}

const QUICK_START: Array<Partial<Template> & { name: string; content: string; category: string }> = [
  {
    name: 'Event Announcement',
    category: 'Announcement',
    description: 'Announce an upcoming event',
    content:
      'We are thrilled to announce [EVENT NAME] on [DATE] at [VENUE]! Join us for an unforgettable experience. Tickets on sale now.',
    hashtags: '#bollywood #event #bayarea',
  },
  {
    name: 'Early Bird Promotion',
    category: 'Promotion',
    description: 'Limited-time early bird pricing',
    content:
      'Early bird tickets for [EVENT] are live! Save [X]% when you book before [DATE]. Link in bio.',
    hashtags: '#earlybird #tickets #deal',
  },
  {
    name: 'Behind the Scenes',
    category: 'Behind-the-scenes',
    description: 'Share prep and production moments',
    content:
      'A sneak peek at what is happening behind the scenes for [EVENT]. The magic is real!',
    hashtags: '#bts #behindthescenes',
  },
  {
    name: 'Thank You Recap',
    category: 'Recap',
    description: 'Post-event thank you',
    content:
      'What an incredible night at [EVENT]! Thank you to our audience, artists, and partners for making it unforgettable.',
    hashtags: '#thankyou #recap',
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [fName, setFName] = useState('')
  const [fCategory, setFCategory] = useState('Promotion')
  const [fDescription, setFDescription] = useState('')
  const [fContent, setFContent] = useState('')
  const [fHashtags, setFHashtags] = useState('')
  const [fTone, setFTone] = useState('vibrant')
  const [fPlatforms, setFPlatforms] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      await loadTemplates(user.id)
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTemplates = async (uid: string) => {
    const { data } = await supabase
      .from('post_templates')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
    setTemplates((data as Template[]) || [])
  }

  const resetForm = () => {
    setFName('')
    setFCategory('Promotion')
    setFDescription('')
    setFContent('')
    setFHashtags('')
    setFTone('vibrant')
    setFPlatforms([])
    setEditing(null)
  }

  const openCreate = (seed?: Partial<Template>) => {
    resetForm()
    if (seed) {
      setFName(seed.name || '')
      setFCategory(seed.category || 'Promotion')
      setFDescription(seed.description || '')
      setFContent(seed.content || '')
      setFHashtags(seed.hashtags || '')
      if (seed.default_tone) setFTone(seed.default_tone)
      if (seed.default_platforms) setFPlatforms(seed.default_platforms)
    }
    setModalOpen(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setFName(t.name)
    setFCategory(t.category || 'Other')
    setFDescription(t.description || '')
    setFContent(t.content)
    setFHashtags(t.hashtags || '')
    setFTone(t.default_tone || 'vibrant')
    setFPlatforms(t.default_platforms || [])
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const handleSave = async () => {
    if (!fName.trim() || !fContent.trim()) {
      alert('Name and content are required.')
      return
    }
    setSaving(true)
    const payload = {
      user_id: userId,
      name: fName.trim(),
      category: fCategory,
      description: fDescription.trim() || null,
      content: fContent,
      hashtags: fHashtags.trim() || null,
      default_tone: fTone,
      default_platforms: fPlatforms,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      const { error } = await supabase
        .from('post_templates')
        .update(payload)
        .eq('id', editing.id)
      if (error) {
        alert('Failed to update template: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('post_templates')
        .insert({ ...payload, usage_count: 0, created_at: new Date().toISOString() })
      if (error) {
        alert('Failed to create template: ' + error.message)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    closeModal()
    await loadTemplates(userId)
  }

  const handleDelete = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"?`)) return
    const { error } = await supabase.from('post_templates').delete().eq('id', t.id)
    if (error) {
      alert('Failed to delete: ' + error.message)
      return
    }
    await loadTemplates(userId)
  }

  const handleDuplicate = async (t: Template) => {
    const { error } = await supabase.from('post_templates').insert({
      user_id: userId,
      name: `${t.name} (Copy)`,
      category: t.category,
      description: t.description,
      content: t.content,
      hashtags: t.hashtags,
      image_urls: t.image_urls,
      default_tone: t.default_tone,
      default_platforms: t.default_platforms,
      usage_count: 0,
      created_at: new Date().toISOString(),
    })
    if (error) {
      alert('Failed to duplicate: ' + error.message)
      return
    }
    await loadTemplates(userId)
  }

  const handleUse = (t: Template) => {
    router.push(`/social/compose?templateId=${t.id}`)
  }

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [templates, categoryFilter, search])

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A] transition-colors'
  const labelClass = 'block text-sm text-gray-400 mb-1.5'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070510] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#E8970A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: 'Playfair Display, serif', color: '#E8970A' }}
            >
              Content Templates
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Reusable post templates to compose faster
            </p>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm text-black hover:opacity-90"
            style={{ backgroundColor: '#E8970A' }}
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>

        {/* Filters */}
        {templates.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates by name..."
                className={inputClass + ' pl-10'}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClass + ' sm:w-56'}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {templates.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-10 text-center">
            <FileText size={48} className="mx-auto text-gray-600 mb-4" />
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              No templates yet
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Create reusable templates to compose social posts faster. Get started with one of
              our quick-start suggestions below.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              {QUICK_START.map((q) => (
                <button
                  key={q.name}
                  onClick={() => openCreate(q)}
                  className="p-4 rounded-lg bg-[#070510] border border-[#1A1726] hover:border-[#E8970A]/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[q.category] || '#888'}30`,
                        color: CATEGORY_COLORS[q.category] || '#888',
                      }}
                    >
                      {q.category}
                    </span>
                  </div>
                  <div className="text-sm font-semibold mb-1">{q.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{q.content}</div>
                </button>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-10 text-center text-sm text-gray-400">
            No templates match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => {
              const categoryColor = CATEGORY_COLORS[t.category || 'Other'] || '#888'
              const firstImage = t.image_urls && t.image_urls.length > 0 ? t.image_urls[0] : null
              return (
                <div
                  key={t.id}
                  className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] overflow-hidden hover:border-[#E8970A]/40 transition-colors flex flex-col"
                >
                  {firstImage && (
                    <div className="aspect-video overflow-hidden bg-[#070510]">
                      <img
                        src={firstImage}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3
                        className="text-lg font-bold flex-1"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {t.name}
                      </h3>
                      {t.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: `${categoryColor}30`,
                            color: categoryColor,
                          }}
                        >
                          {t.category}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-3 mb-3 flex-1">
                      {t.content}
                    </p>

                    {t.hashtags && (
                      <p className="text-xs text-[#E8970A] line-clamp-1 mb-3">{t.hashtags}</p>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      Used {t.usage_count || 0} {(t.usage_count || 0) === 1 ? 'time' : 'times'}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#1A1726]">
                      <button
                        onClick={() => handleUse(t)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-black hover:opacity-90"
                        style={{ backgroundColor: '#E8970A' }}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(t)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                        title="Duplicate"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0F0D1A] border-b border-[#1A1726] px-6 py-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: 'Playfair Display, serif', color: '#E8970A' }}
              >
                {editing ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Event Announcement"
                />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows={2}
                  value={fDescription}
                  onChange={(e) => setFDescription(e.target.value)}
                  className={inputClass}
                  placeholder="Optional notes about when to use this template"
                />
              </div>

              <div>
                <label className={labelClass}>Content *</label>
                <textarea
                  rows={6}
                  value={fContent}
                  onChange={(e) => setFContent(e.target.value)}
                  className={inputClass}
                  placeholder="Write your template content. Use [PLACEHOLDERS] for variable fields."
                />
              </div>

              <div>
                <label className={labelClass}>Hashtags</label>
                <input
                  type="text"
                  value={fHashtags}
                  onChange={(e) => setFHashtags(e.target.value)}
                  className={inputClass}
                  placeholder="#bollywood #bayarea"
                />
              </div>

              <div>
                <label className={labelClass}>Default tone</label>
                <select
                  value={fTone}
                  onChange={(e) => setFTone(e.target.value)}
                  className={inputClass}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Default platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const active = fPlatforms.includes(p.id)
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() =>
                          setFPlatforms((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((x) => x !== p.id)
                              : [...prev, p.id]
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          active
                            ? 'border-[#E8970A] bg-[#E8970A]/5'
                            : 'border-[#1A1726] bg-[#070510]'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span>{p.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#0F0D1A] border-t border-[#1A1726] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-lg text-sm text-gray-300 border border-[#1A1726] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-black hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E8970A' }}
              >
                <Save size={14} />
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
