'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Plus, Edit, Trash2, Check, Star } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string
  is_active: boolean
  is_default: boolean
  color: string
  emoji: string
  created_at: string
}

const EMOJIS = ['🪔', '🎵', '🎭', '💃', '🎤', '🎬', '🎉', '🌟', '🎨', '🌺', '🪕', '🥁']
const COLORS = ['#E8970A', '#138808', '#FF9933', '#9B59B6', '#1ABC9C', '#E85D75', '#3498DB', '#F4C430']

export default function WorkspacesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', emoji: '🪔', color: '#E8970A' })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await fetchWorkspaces(user.id)
      setLoading(false)
    })
  }, [])

  const fetchWorkspaces = async (uid: string) => {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', uid)
      .order('is_default', { ascending: false })
    setWorkspaces((data || []) as Workspace[])
  }

  const save = async () => {
    if (!userId || !form.name.trim()) return

    if (editingId) {
      await supabase.from('workspaces').update({
        name: form.name,
        description: form.description,
        emoji: form.emoji,
        color: form.color,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId)
    } else {
      await supabase.from('workspaces').insert({
        owner_id: userId,
        ...form,
        is_active: true,
        is_default: workspaces.length === 0,
      })
    }

    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', emoji: '🪔', color: '#E8970A' })
    await fetchWorkspaces(userId)
  }

  const setDefault = async (id: string) => {
    if (!userId) return
    // Unset existing defaults
    await supabase.from('workspaces').update({ is_default: false }).eq('owner_id', userId)
    // Set new default
    await supabase.from('workspaces').update({ is_default: true }).eq('id', id)
    await fetchWorkspaces(userId)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this workspace? Posts in this workspace will become un-grouped.')) return
    await supabase.from('workspaces').delete().eq('id', id)
    if (userId) await fetchWorkspaces(userId)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Briefcase size={28} />
              Workspaces
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Separate brands or projects into different workspaces</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', description: '', emoji: '🪔', color: '#E8970A' }) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90"
          >
            <Plus size={16} />
            New Workspace
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
            <Briefcase size={40} className="mx-auto text-gray-600 mb-3" />
            No workspaces yet. Create one to organize multiple brands.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <div key={ws.id} className="bg-[#0F0D1A] border-2 rounded-xl p-5" style={{ borderColor: ws.is_default ? ws.color : '#1A1726' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">{ws.emoji}</div>
                    {ws.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${ws.color}20`, color: ws.color }}>
                        <Star size={10} />
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-white">{ws.name}</h3>
                {ws.description && <p className="text-xs text-gray-500 mt-1">{ws.description}</p>}
                <div className="flex items-center gap-2 mt-4">
                  {!ws.is_default && (
                    <button onClick={() => setDefault(ws.id)} className="text-xs text-[#E8970A] hover:underline">Make Default</button>
                  )}
                  <button
                    onClick={() => { setEditingId(ws.id); setForm({ name: ws.name, description: ws.description, emoji: ws.emoji, color: ws.color }); setShowForm(true) }}
                    className="ml-auto p-1.5 rounded hover:bg-white/5 text-gray-400"
                  >
                    <Edit size={14} />
                  </button>
                  <button onClick={() => remove(ws.id)} className="p-1.5 rounded hover:bg-white/5 text-gray-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                {editingId ? 'Edit Workspace' : 'New Workspace'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Workspace name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., My Music Brand" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setForm({ ...form, emoji: e })} className={`w-10 h-10 rounded-lg text-2xl ${form.emoji === e ? 'bg-[#E8970A]/20 border-2 border-[#E8970A]' : 'bg-[#070510] border border-[#1A1726]'}`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-10 h-10 rounded-lg ${form.color === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={save} disabled={!form.name.trim()} className="flex-1 py-2 rounded-lg bg-[#E8970A] text-black font-medium disabled:opacity-50">Save</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-gray-400 border border-[#1A1726]">Cancel</button>
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
