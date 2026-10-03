'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QRCode from '@/components/QRCode'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Copy, Check, Edit2, Trash2, BarChart3, QrCode as QrIcon, X, ExternalLink } from 'lucide-react'

interface ShortLink {
  id: string
  slug: string
  destination_url: string
  title: string
  description: string
  click_count: number
  last_clicked_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface ClickRow {
  id: string
  created_at: string
  user_agent: string
  referrer: string
}

// URL shortener output is meant to be shared publicly, so always
// display the production domain — even when developing locally against
// http://localhost:3000. Test the redirect locally by swapping the host
// after copying.
const SITE_URL = 'https://indianprograms.com'

// Users routinely type "cnn.com" or "www.cnn.com" without a scheme —
// `new URL(...)` rejects those. Prepend https:// if there's no scheme
// so the validator matches user expectations.
function normalizeDestination(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function ShortLinksPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authChecked, setAuthChecked] = useState(false)
  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ShortLink | null>(null)
  const [formDest, setFormDest] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formExpires, setFormExpires] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [statsFor, setStatsFor] = useState<ShortLink | null>(null)
  const [statsClicks, setStatsClicks] = useState<ClickRow[]>([])
  const [qrFor, setQrFor] = useState<ShortLink | null>(null)

  const loadLinks = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setAuthChecked(true)
    const { data } = await supabase
      .from('short_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setLinks((data as ShortLink[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setFormDest('')
    setFormSlug('')
    setFormTitle('')
    setFormDesc('')
    setFormExpires('')
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (link: ShortLink) => {
    setEditing(link)
    setFormDest(link.destination_url)
    setFormSlug(link.slug)
    setFormTitle(link.title)
    setFormDesc(link.description)
    setFormExpires(link.expires_at ? link.expires_at.slice(0, 16) : '')
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setFormError('')
    setSaving(true)
    const normalizedDest = normalizeDestination(formDest)
    try {
      new URL(normalizedDest)
    } catch {
      setFormError('Invalid URL')
      setSaving(false)
      return
    }

    if (editing) {
      const { error } = await supabase
        .from('short_links')
        .update({
          destination_url: normalizedDest,
          title: formTitle,
          description: formDesc,
          expires_at: formExpires || null,
        })
        .eq('id', editing.id)
      if (error) {
        setFormError(error.message)
        setSaving(false)
        return
      }
    } else {
      const res = await fetch('/api/shortlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_url: normalizedDest,
          slug: formSlug || undefined,
          title: formTitle,
          description: formDesc,
          expires_at: formExpires || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Failed to create')
        setSaving(false)
        return
      }
    }
    setShowForm(false)
    setSaving(false)
    await loadLinks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this short link?')) return
    await supabase.from('short_links').delete().eq('id', id)
    await loadLinks()
  }

  const openStats = async (link: ShortLink) => {
    setStatsFor(link)
    const { data } = await supabase
      .from('short_link_clicks')
      .select('*')
      .eq('short_link_id', link.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setStatsClicks((data as ClickRow[]) || [])
  }

  const shortUrl = (slug: string) => `${SITE_URL}/s/${slug}`

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isExpired = (link: ShortLink) => link.expires_at && new Date(link.expires_at) < new Date()

  const filtered = links.filter(
    (l) =>
      l.slug.toLowerCase().includes(search.toLowerCase()) ||
      l.destination_url.toLowerCase().includes(search.toLowerCase()) ||
      l.title.toLowerCase().includes(search.toLowerCase())
  )

  if (!authChecked) {
    return <div className="min-h-screen bg-[#070510] flex items-center justify-center text-gray-400">Loading...</div>
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-sm text-white focus:outline-none focus:border-[#E8970A]'
  const labelCls = 'block text-xs text-gray-400 mb-1.5 uppercase tracking-wide'

  return (
    <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              Short Links
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Create and track branded short links</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E8970A] text-black font-semibold hover:brightness-110 transition w-full sm:w-auto"
          >
            <Plus size={18} /> Create New Link
          </button>
        </div>

        <div className="mb-6 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by slug, destination, or title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white focus:outline-none focus:border-[#E8970A]"
          />
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-12 text-center">
            <QrIcon size={48} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">Create your first short link</h3>
            <p className="text-gray-400 mb-6">Build branded short URLs and track clicks.</p>
            <button
              onClick={openCreate}
              className="px-5 py-2.5 rounded-lg bg-[#E8970A] text-black font-semibold hover:brightness-110"
            >
              Create Link
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table - hidden on mobile */}
            <div className="hidden md:block rounded-xl bg-[#0F0D1A] border border-[#1A1726] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#070510] text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Short URL</th>
                    <th className="text-left px-4 py-3">Destination</th>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3">Clicks</th>
                    <th className="text-left px-4 py-3">Created</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((link) => {
                    const url = shortUrl(link.slug)
                    const expired = isExpired(link)
                    return (
                      <tr key={link.id} className="border-t border-[#1A1726] hover:bg-white/5">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyToClipboard(url, link.id)}
                            className="flex items-center gap-2 text-[#E8970A] hover:underline"
                          >
                            /s/{link.slug}
                            {copiedId === link.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <a
                            href={link.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-gray-300 hover:text-white truncate"
                          >
                            <span className="truncate">{link.destination_url}</span>
                            <ExternalLink size={12} className="flex-shrink-0" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{link.title || '—'}</td>
                        <td className="px-4 py-3 text-white font-semibold">{link.click_count}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(link.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">Expired</span>
                          ) : link.is_active ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-500/10 text-gray-400">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(link)} className="p-2 rounded hover:bg-white/10" title="Edit">
                              <Edit2 size={14} className="text-gray-400" />
                            </button>
                            <button onClick={() => openStats(link)} className="p-2 rounded hover:bg-white/10" title="Stats">
                              <BarChart3 size={14} className="text-gray-400" />
                            </button>
                            <button onClick={() => setQrFor(link)} className="p-2 rounded hover:bg-white/10" title="QR">
                              <QrIcon size={14} className="text-gray-400" />
                            </button>
                            <button onClick={() => handleDelete(link.id)} className="p-2 rounded hover:bg-white/10" title="Delete">
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout - hidden on desktop */}
            <div className="md:hidden space-y-3">
              {filtered.map((link) => {
                const url = shortUrl(link.slug)
                const expired = isExpired(link)
                return (
                  <div key={link.id} className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-4">
                    {/* Header: Short URL + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => copyToClipboard(url, link.id)}
                        className="flex items-center gap-2 text-[#E8970A] font-semibold text-sm hover:underline"
                      >
                        /s/{link.slug}
                        {copiedId === link.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                      {expired ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">Expired</span>
                      ) : link.is_active ? (
                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-500/10 text-gray-400">Inactive</span>
                      )}
                    </div>

                    {/* Title (if present) */}
                    {link.title && (
                      <div className="text-sm text-gray-300 mb-2">{link.title}</div>
                    )}

                    {/* Destination URL */}
                    <a
                      href={link.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white truncate mb-3"
                    >
                      <span className="truncate">{link.destination_url}</span>
                      <ExternalLink size={12} className="flex-shrink-0" />
                    </a>

                    {/* Stats row: Clicks + Created */}
                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Clicks</span>
                        <span className="ml-1.5 text-white font-semibold">{link.click_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wide">Created</span>
                        <span className="ml-1.5 text-gray-400">{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-t border-[#1A1726] pt-3">
                      <button onClick={() => openEdit(link)} className="p-2 rounded hover:bg-white/10" title="Edit">
                        <Edit2 size={16} className="text-gray-400" />
                      </button>
                      <button onClick={() => openStats(link)} className="p-2 rounded hover:bg-white/10" title="Stats">
                        <BarChart3 size={16} className="text-gray-400" />
                      </button>
                      <button onClick={() => setQrFor(link)} className="p-2 rounded hover:bg-white/10" title="QR">
                        <QrIcon size={16} className="text-gray-400" />
                      </button>
                      <button onClick={() => handleDelete(link.id)} className="p-2 rounded hover:bg-white/10 ml-auto" title="Delete">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowForm(false)}>
          <div
            className="w-full max-w-[calc(100vw-2rem)] md:max-w-lg rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editing ? 'Edit Link' : 'Create Short Link'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Destination URL *</label>
                <input type="url" value={formDest} onChange={(e) => setFormDest(e.target.value)} className={inputCls} placeholder="https://..." />
              </div>
              {!editing && (
                <div>
                  <label className={labelCls}>Custom slug (optional)</label>
                  <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} className={inputCls} placeholder="auto-generated if empty" />
                </div>
              )}
              <div>
                <label className={labelCls}>Title</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Expires at (optional)</label>
                <input type="datetime-local" value={formExpires} onChange={(e) => setFormExpires(e.target.value)} className={inputCls} />
              </div>
              {formError && <div className="text-sm text-red-400">{formError}</div>}
              <button
                onClick={handleSave}
                disabled={saving || !formDest}
                className="w-full py-2.5 rounded-lg bg-[#E8970A] text-black font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setStatsFor(null)}>
          <div
            className="w-full max-w-[calc(100vw-2rem)] md:max-w-lg rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Stats: /s/{statsFor.slug}</h2>
              <button onClick={() => setStatsFor(null)} className="p-1 rounded hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg bg-[#070510] border border-[#1A1726] p-4">
                <div className="text-xs text-gray-400 uppercase">Total clicks</div>
                <div className="text-3xl font-bold text-[#E8970A]">{statsFor.click_count}</div>
              </div>
              <div className="rounded-lg bg-[#070510] border border-[#1A1726] p-4">
                <div className="text-xs text-gray-400 uppercase">Last clicked</div>
                <div className="text-sm mt-2">
                  {statsFor.last_clicked_at ? new Date(statsFor.last_clicked_at).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-2">Recent clicks</div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {statsClicks.length === 0 ? (
                  <div className="text-gray-500 text-sm">No clicks yet.</div>
                ) : (
                  statsClicks.map((c) => (
                    <div key={c.id} className="text-xs rounded border border-[#1A1726] bg-[#070510] p-2">
                      <div className="text-gray-300">{new Date(c.created_at).toLocaleString()}</div>
                      <div className="text-gray-500 truncate">{c.user_agent || 'Unknown'}</div>
                      {c.referrer && <div className="text-gray-600 truncate">ref: {c.referrer}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setQrFor(null)}>
          <div
            className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">QR Code</h2>
              <button onClick={() => setQrFor(null)} className="p-1 rounded hover:bg-white/10">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 rounded-lg bg-white inline-block">
              <QRCode data={shortUrl(qrFor.slug)} size={240} fgColor="#070510" bgColor="#FFFFFF" />
            </div>
            <div className="mt-3 text-sm text-gray-400">{shortUrl(qrFor.slug)}</div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
