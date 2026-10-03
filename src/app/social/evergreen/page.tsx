'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Repeat, Plus, Trash2, Pause, Play, Clock } from 'lucide-react'

export default function EvergreenPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [evergreen, setEvergreen] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState('')
  const [recycleAfter, setRecycleAfter] = useState(30)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await loadData(user.id)
      setLoading(false)
    })
  }, [])

  const loadData = async (uid: string) => {
    const { data: ever } = await supabase
      .from('evergreen_posts')
      .select('*, scheduled_post:scheduled_posts(*)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setEvergreen(ever || [])

    const { data: p } = await supabase
      .from('scheduled_posts')
      .select('id, title, content, image_url, platforms')
      .eq('user_id', uid)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts(p || [])
  }

  const addEvergreen = async () => {
    if (!userId || !selectedPostId) return
    await supabase.from('evergreen_posts').insert({
      user_id: userId,
      scheduled_post_id: selectedPostId,
      recycle_after_days: recycleAfter,
      is_active: true,
    })
    setShowAdd(false)
    setSelectedPostId('')
    setRecycleAfter(30)
    await loadData(userId)
  }

  const toggle = async (id: string, current: boolean) => {
    await supabase.from('evergreen_posts').update({ is_active: !current }).eq('id', id)
    if (userId) await loadData(userId)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove from evergreen?')) return
    await supabase.from('evergreen_posts').delete().eq('id', id)
    if (userId) await loadData(userId)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <Repeat size={28} />
              Evergreen Content
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Posts that automatically recycle to keep your feed fresh</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90"
          >
            <Plus size={16} />
            Add Evergreen Post
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : evergreen.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
            <Repeat size={40} className="mx-auto text-gray-600 mb-3" />
            No evergreen posts yet. Add one to start recycling content automatically.
          </div>
        ) : (
          <div className="space-y-3">
            {evergreen.map((e) => {
              const post = e.scheduled_post
              const lastDate = e.last_recycled_at ? new Date(e.last_recycled_at) : null
              const daysAgo = lastDate ? Math.floor((Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000)) : null
              return (
                <div key={e.id} className={`bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4 ${!e.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    {post?.image_url && <img src={post.image_url} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{post?.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mt-1">{post?.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Repeat size={11} />
                          Every {e.recycle_after_days} days
                        </span>
                        <span>Recycled {e.recycle_count} times</span>
                        {daysAgo !== null && <span>Last: {daysAgo}d ago</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggle(e.id, e.is_active)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                        {e.is_active ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button onClick={() => remove(e.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-md p-6">
              <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Add Evergreen Post</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Choose existing post</label>
                  <select value={selectedPostId} onChange={(e) => setSelectedPostId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white">
                    <option value="">Select a post...</option>
                    {posts.map(p => (
                      <option key={p.id} value={p.id}>{(p.title || p.content || '').substring(0, 60)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Recycle every</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={365} value={recycleAfter} onChange={(e) => setRecycleAfter(Number(e.target.value))} className="w-24 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
                    <span className="text-sm text-gray-400">days</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={addEvergreen} disabled={!selectedPostId} className="flex-1 py-2 rounded-lg text-sm bg-[#E8970A] text-black font-medium hover:opacity-90 disabled:opacity-50">Add</button>
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5">Cancel</button>
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
