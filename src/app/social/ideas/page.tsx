'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Lightbulb, Plus, Trash2, ArrowRight, Sparkles, Tag, X } from 'lucide-react'

interface ContentIdea {
  id: string
  text: string
  source: string
  source_url: string
  tags: string[]
  used: boolean
  used_at: string | null
  created_at: string
}

export default function IdeasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState<'all' | 'unused' | 'used'>('unused')
  const [newIdea, setNewIdea] = useState('')
  const [newTags, setNewTags] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await fetchIdeas(user.id)
      setLoading(false)
    })
  }, [])

  const fetchIdeas = async (uid: string) => {
    const { data } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setIdeas((data || []) as ContentIdea[])
  }

  const addIdea = async () => {
    if (!userId || !newIdea.trim()) return
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('content_ideas').insert({
      user_id: userId,
      text: newIdea.trim(),
      tags,
      source: 'manual',
    })
    setNewIdea('')
    setNewTags('')
    await fetchIdeas(userId)
  }

  const deleteIdea = async (id: string) => {
    await supabase.from('content_ideas').delete().eq('id', id)
    if (userId) await fetchIdeas(userId)
  }

  const handleUseIdea = (idea: ContentIdea) => {
    // Pass the idea to the composer via URL params
    const params = new URLSearchParams({ ideaId: idea.id, content: idea.text })
    router.push(`/social/compose?${params.toString()}`)
  }

  const generateIdeas = async () => {
    if (!aiTopic.trim() || !userId) return
    setAiGenerating(true)
    try {
      const res = await fetch('/api/social/ai-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, count: 10 }),
      })
      const data = await res.json()
      if (data.ideas && Array.isArray(data.ideas)) {
        for (const text of data.ideas) {
          await supabase.from('content_ideas').insert({
            user_id: userId,
            text,
            source: 'ai',
            tags: [aiTopic.toLowerCase()],
          })
        }
        await fetchIdeas(userId)
        setAiTopic('')
      } else {
        alert(data.error || 'Failed to generate ideas')
      }
    } catch (err: any) {
      alert(err.message)
    }
    setAiGenerating(false)
  }

  const filteredIdeas = ideas.filter(i => {
    if (showFilter === 'unused') return !i.used
    if (showFilter === 'used') return i.used
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <Lightbulb size={28} />
            Content Idea Inbox
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Capture content ideas without scheduling them. Perfect for brainstorming.</p>
        </div>

        {/* Add new idea */}
        <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">💡 Add a new idea</h3>
          <textarea
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder="What's on your mind? Quick idea, observation, or content concept..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm mb-2"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="flex-1 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
            />
            <button
              onClick={addIdea}
              disabled={!newIdea.trim()}
              className="px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={14} className="inline mr-1" />
              Save Idea
            </button>
          </div>
        </div>

        {/* AI Idea Generator */}
        <div className="bg-[#E8970A]/5 border border-[#E8970A]/30 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-[#E8970A]" />
            Generate ideas with AI
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Topic or theme (e.g., 'Diwali concert', 'classical dance workshop')"
              className="flex-1 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
            />
            <button
              onClick={generateIdeas}
              disabled={!aiTopic.trim() || aiGenerating}
              className="px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles size={14} className="inline mr-1" />
              {aiGenerating ? 'Generating...' : 'Generate 10 Ideas'}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['unused', 'used', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setShowFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${showFilter === f ? 'bg-[#E8970A]/15 text-[#E8970A] border border-[#E8970A]/30' : 'text-gray-400 border border-[#1A1726] hover:bg-white/5'}`}
            >
              {f === 'unused' ? 'Inbox' : f === 'used' ? 'Used' : 'All'} ({ideas.filter(i => f === 'unused' ? !i.used : f === 'used' ? i.used : true).length})
            </button>
          ))}
        </div>

        {/* Ideas list */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredIdeas.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
            <Lightbulb size={40} className="mx-auto text-gray-600 mb-3" />
            No ideas yet. Add one above or generate with AI.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIdeas.map((idea) => (
              <div key={idea.id} className={`bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4 ${idea.used ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{idea.text}</p>
                    {idea.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {idea.tags.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-[#070510] text-gray-400 border border-[#1A1726]">
                            <Tag size={9} className="inline mr-1" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 text-xs text-gray-500 mt-2">
                      <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                      {idea.source === 'ai' && <span className="text-[#E8970A]">✨ AI</span>}
                      {idea.used && <span className="text-green-400">✓ Used</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleUseIdea(idea)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-[#E8970A]/15 text-[#E8970A] border border-[#E8970A]/30 hover:bg-[#E8970A]/25 flex items-center gap-1"
                    >
                      Use <ArrowRight size={11} />
                    </button>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-white/5"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
