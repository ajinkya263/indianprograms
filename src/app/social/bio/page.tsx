'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Link2, Plus, Trash2, Edit, Eye, Save, ExternalLink, GripVertical } from 'lucide-react'

interface BioPage {
  id?: string
  slug: string
  title: string
  bio: string
  avatar_url: string
  cover_url: string
  theme: string
  background_color: string
  text_color: string
  button_color: string
  show_events: boolean
  is_active: boolean
  view_count: number
}

interface BioLink {
  id: string
  bio_page_id: string
  title: string
  url: string
  description: string
  icon: string
  is_active: boolean
  position: number
  click_count: number
  thumbnail_url: string
}

export default function BioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [bioPage, setBioPage] = useState<BioPage | null>(null)
  const [links, setLinks] = useState<BioLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [editingLink, setEditingLink] = useState<BioLink | null>(null)
  const [linkForm, setLinkForm] = useState({ title: '', url: '', description: '', icon: '' })
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await load(user.id)
      setLoading(false)
    })
  }, [])

  const load = async (uid: string) => {
    const { data: page } = await supabase.from('bio_pages').select('*').eq('user_id', uid).maybeSingle()
    if (page) {
      setBioPage(page as BioPage)
      const { data: linksData } = await supabase.from('bio_links').select('*').eq('bio_page_id', (page as any).id).order('position')
      setLinks((linksData || []) as BioLink[])
    }
  }

  const createPage = async (slug: string, title: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('bio_pages')
      .insert({
        user_id: userId,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        title,
        bio: '',
        theme: 'saffron',
        background_color: '#070510',
        text_color: '#FFFFFF',
        button_color: '#E8970A',
        show_events: true,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      alert('Failed to create: ' + error.message)
      return
    }
    setBioPage(data as BioPage)
  }

  const savePage = async () => {
    if (!userId || !bioPage) return
    setSaving(true)
    const { error } = await supabase.from('bio_pages').update({
      title: bioPage.title,
      bio: bioPage.bio,
      avatar_url: bioPage.avatar_url,
      cover_url: bioPage.cover_url,
      theme: bioPage.theme,
      background_color: bioPage.background_color,
      text_color: bioPage.text_color,
      button_color: bioPage.button_color,
      show_events: bioPage.show_events,
      updated_at: new Date().toISOString(),
    }).eq('id', bioPage.id!)
    setSaving(false)
    if (error) alert('Save failed: ' + error.message)
  }

  const addOrUpdateLink = async () => {
    if (!userId || !bioPage || !linkForm.title.trim() || !linkForm.url.trim()) return

    if (editingLink) {
      await supabase.from('bio_links').update(linkForm).eq('id', editingLink.id)
    } else {
      await supabase.from('bio_links').insert({
        bio_page_id: bioPage.id,
        user_id: userId,
        ...linkForm,
        position: links.length,
        is_active: true,
      })
    }
    setLinkForm({ title: '', url: '', description: '', icon: '' })
    setShowLinkForm(false)
    setEditingLink(null)
    if (userId) await load(userId)
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return
    await supabase.from('bio_links').delete().eq('id', id)
    if (userId) await load(userId)
  }

  const startEditLink = (link: BioLink) => {
    setEditingLink(link)
    setLinkForm({ title: link.title, url: link.url, description: link.description, icon: link.icon })
    setShowLinkForm(true)
  }

  if (loading) return <div className="min-h-screen bg-[#070510] text-white flex items-center justify-center">Loading...</div>

  if (!bioPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center">
            <Link2 size={48} className="mx-auto text-[#E8970A] mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Create Your Link-in-Bio Page</h1>
            <p className="text-gray-400 mb-6">Share all your important links from one beautiful page.</p>
            <CreatePageForm onCreate={createPage} />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/bio/${bioPage.slug}`

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Link2 size={28} />
              Link in Bio
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Public URL: <a href={publicUrl} target="_blank" rel="noopener" className="text-[#E8970A] hover:underline">{publicUrl}</a>
            </p>
          </div>
          <a href={publicUrl} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#E8970A] border border-[#E8970A]/30 hover:bg-[#E8970A]/10">
            <Eye size={14} />
            View Live
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <section className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Page Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title</label>
                  <input type="text" value={bioPage.title} onChange={(e) => setBioPage({ ...bioPage, title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Bio</label>
                  <textarea value={bioPage.bio} onChange={(e) => setBioPage({ ...bioPage, bio: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Avatar URL</label>
                  <input type="url" value={bioPage.avatar_url} onChange={(e) => setBioPage({ ...bioPage, avatar_url: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Background</label>
                    <input type="color" value={bioPage.background_color} onChange={(e) => setBioPage({ ...bioPage, background_color: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Text</label>
                    <input type="color" value={bioPage.text_color} onChange={(e) => setBioPage({ ...bioPage, text_color: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Buttons</label>
                    <input type="color" value={bioPage.button_color} onChange={(e) => setBioPage({ ...bioPage, button_color: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={bioPage.show_events} onChange={(e) => setBioPage({ ...bioPage, show_events: e.target.checked })} className="accent-[#E8970A]" />
                  Show my upcoming events on this page
                </label>
                <button onClick={savePage} disabled={saving} className="w-full py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  <Save size={14} className="inline mr-1" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </section>

            <section className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Links ({links.length})</h2>
                <button onClick={() => { setShowLinkForm(true); setEditingLink(null); setLinkForm({ title: '', url: '', description: '', icon: '' }) }} className="text-xs text-[#E8970A] hover:underline">+ Add Link</button>
              </div>
              {links.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No links yet</div>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726]">
                      <GripVertical size={14} className="text-gray-600" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{link.title}</div>
                        <div className="text-xs text-gray-500 truncate">{link.url}</div>
                      </div>
                      <button onClick={() => startEditLink(link)} className="p-1 text-gray-400 hover:text-white"><Edit size={12} /></button>
                      <button onClick={() => deleteLink(link.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Live preview — desktop: sticky sidebar */}
          <div className="hidden md:block sticky top-24 self-start">
            <div className="rounded-xl border border-[#1A1726] overflow-hidden">
              <div style={{ backgroundColor: bioPage.background_color, color: bioPage.text_color }} className="p-6 min-h-[500px]">
                {bioPage.avatar_url && (
                  <img src={bioPage.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
                )}
                <h3 className="text-xl font-bold text-center mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{bioPage.title}</h3>
                {bioPage.bio && <p className="text-sm text-center mb-6 opacity-80">{bioPage.bio}</p>}
                <div className="space-y-2">
                  {links.filter(l => l.is_active).map((link) => (
                    <div key={link.id} className="block w-full px-4 py-3 rounded-lg text-center font-medium text-sm" style={{ backgroundColor: bioPage.button_color, color: '#000' }}>
                      {link.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live preview — mobile: collapsible section */}
          <div className="md:hidden">
            <button
              onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-sm font-medium text-white"
            >
              <span className="flex items-center gap-2"><Eye size={16} className="text-[#E8970A]" /> Live Preview</span>
              <span className="text-gray-400 text-xs">{mobilePreviewOpen ? 'Hide' : 'Show'}</span>
            </button>
            {mobilePreviewOpen && (
              <div className="mt-2 rounded-xl border border-[#1A1726] overflow-hidden">
                <div style={{ backgroundColor: bioPage.background_color, color: bioPage.text_color }} className="p-6">
                  {bioPage.avatar_url && (
                    <img src={bioPage.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
                  )}
                  <h3 className="text-xl font-bold text-center mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{bioPage.title}</h3>
                  {bioPage.bio && <p className="text-sm text-center mb-6 opacity-80">{bioPage.bio}</p>}
                  <div className="space-y-2">
                    {links.filter(l => l.is_active).map((link) => (
                      <div key={link.id} className="block w-full px-4 py-3 rounded-lg text-center font-medium text-sm" style={{ backgroundColor: bioPage.button_color, color: '#000' }}>
                        {link.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showLinkForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-md p-6">
              <h2 className="text-lg font-bold text-white mb-4">{editingLink ? 'Edit Link' : 'Add Link'}</h2>
              <div className="space-y-3">
                <input type="text" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} placeholder="Link title" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                <input type="url" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                <input type="text" value={linkForm.description} onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })} placeholder="Description (optional)" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                <div className="flex gap-2">
                  <button onClick={addOrUpdateLink} className="flex-1 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm">{editingLink ? 'Update' : 'Add'}</button>
                  <button onClick={() => { setShowLinkForm(false); setEditingLink(null) }} className="px-4 py-2 rounded-lg text-gray-400 border border-[#1A1726]">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function CreatePageForm({ onCreate }: { onCreate: (slug: string, title: string) => void }) {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  return (
    <div className="space-y-3 max-w-sm mx-auto">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
      <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="URL slug (e.g., my-name)" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
      <button onClick={() => onCreate(slug, title)} disabled={!slug.trim() || !title.trim()} className="w-full py-2 rounded-lg bg-[#E8970A] text-black font-medium disabled:opacity-50">Create Page</button>
    </div>
  )
}
