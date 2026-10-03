'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Hash, Plus, Edit, Trash2, Copy, Check } from 'lucide-react'

interface HashtagGroup {
  id: string
  name: string
  hashtags: string
  description: string
  use_count: number
  created_at: string
}

export default function HashtagGroupsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [groups, setGroups] = useState<HashtagGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', hashtags: '', description: '' })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await fetchGroups(user.id)
      setLoading(false)
    })
  }, [])

  const fetchGroups = async (uid: string) => {
    const { data } = await supabase
      .from('hashtag_groups')
      .select('*')
      .eq('user_id', uid)
      .order('use_count', { ascending: false })
    setGroups((data || []) as HashtagGroup[])
  }

  const save = async () => {
    if (!userId || !form.name.trim() || !form.hashtags.trim()) return

    if (editingId) {
      await supabase.from('hashtag_groups').update({
        name: form.name,
        hashtags: form.hashtags,
        description: form.description,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId)
    } else {
      await supabase.from('hashtag_groups').insert({
        user_id: userId,
        ...form,
      })
    }

    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', hashtags: '', description: '' })
    await fetchGroups(userId)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this hashtag group?')) return
    await supabase.from('hashtag_groups').delete().eq('id', id)
    if (userId) await fetchGroups(userId)
  }

  const startEdit = (g: HashtagGroup) => {
    setEditingId(g.id)
    setForm({ name: g.name, hashtags: g.hashtags, description: g.description })
    setShowForm(true)
  }

  const copy = async (g: HashtagGroup) => {
    await navigator.clipboard.writeText(g.hashtags)
    setCopiedId(g.id)
    setTimeout(() => setCopiedId(null), 2000)
    if (userId) {
      await supabase.from('hashtag_groups').update({ use_count: g.use_count + 1 }).eq('id', g.id)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Hash size={28} />
              Hashtag Groups
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Save and reuse hashtag sets for different post types</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', hashtags: '', description: '' }) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90"
          >
            <Plus size={16} />
            New Group
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : groups.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
            <Hash size={40} className="mx-auto text-gray-600 mb-3" />
            No hashtag groups yet. Create your first one to save and reuse hashtag sets.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div key={g.id} className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{g.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => copy(g)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white">
                      {copiedId === g.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => startEdit(g)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-white">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => remove(g.id)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {g.description && <p className="text-xs text-gray-500 mb-2">{g.description}</p>}
                <p className="text-sm text-[#E8970A] font-mono leading-relaxed">{g.hashtags}</p>
                <div className="text-xs text-gray-600 mt-2">Used {g.use_count} times</div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                {editingId ? 'Edit Group' : 'New Hashtag Group'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Group name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Diwali Events, Concert Posts"
                    className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hashtags (space-separated)</label>
                  <textarea
                    value={form.hashtags}
                    onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                    placeholder="#diwali #bayareadesi #indianevents #bollywood"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="When to use this group"
                    className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={save} disabled={!form.name.trim() || !form.hashtags.trim()} className="flex-1 py-2 rounded-lg bg-[#E8970A] text-black font-medium hover:opacity-90 disabled:opacity-50">Save</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-gray-400 border border-[#1A1726] hover:bg-white/5">Cancel</button>
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
