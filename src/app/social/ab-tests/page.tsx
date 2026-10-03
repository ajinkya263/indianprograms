'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { FlaskConical, Plus, Trophy, X, Check, Pause } from 'lucide-react'

interface ABTest {
  id: string
  name: string
  status: string
  variants: any[]
  winner_variant_index: number | null
  metric: string
  started_at: string
  ended_at: string | null
}

export default function ABTestsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [tests, setTests] = useState<ABTest[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  // Create form
  const [name, setName] = useState('')
  const [metric, setMetric] = useState('engagement')
  const [variants, setVariants] = useState([{ label: 'A', content: '' }, { label: 'B', content: '' }])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await loadTests(user.id)
      setLoading(false)
    })
  }, [])

  const loadTests = async (uid: string) => {
    const { data } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('user_id', uid)
      .order('started_at', { ascending: false })
    setTests((data || []) as any)
  }

  const addVariant = () => {
    if (variants.length >= 4) return
    setVariants([...variants, { label: String.fromCharCode(65 + variants.length), content: '' }])
  }

  const createTest = async () => {
    if (!userId || !name.trim() || variants.some(v => !v.content.trim())) return
    await supabase.from('ab_tests').insert({
      user_id: userId,
      name,
      status: 'running',
      variants,
      metric,
    })
    setShowCreate(false)
    setName('')
    setVariants([{ label: 'A', content: '' }, { label: 'B', content: '' }])
    await loadTests(userId)
  }

  const markWinner = async (testId: string, variantIdx: number) => {
    await supabase
      .from('ab_tests')
      .update({ winner_variant_index: variantIdx, status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', testId)
    if (userId) await loadTests(userId)
  }

  const togglePause = async (test: ABTest) => {
    const newStatus = test.status === 'running' ? 'paused' : 'running'
    await supabase.from('ab_tests').update({ status: newStatus }).eq('id', test.id)
    if (userId) await loadTests(userId)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <FlaskConical size={28} />
              A/B Tests
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Test variations and pick winners</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90"
          >
            <Plus size={16} />
            New Test
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : tests.length === 0 ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
            <FlaskConical size={40} className="mx-auto text-gray-600 mb-3" />
            No A/B tests yet. Create one to compare variations.
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{test.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        test.status === 'running' ? 'bg-green-500/20 text-green-400' :
                        test.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>{test.status}</span>
                      <span className="text-xs text-gray-500">Metric: {test.metric}</span>
                      <span className="text-xs text-gray-500">{test.variants.length} variants</span>
                    </div>
                  </div>
                  {test.status !== 'completed' && (
                    <button onClick={() => togglePause(test)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                      <Pause size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {test.variants.map((v: any, i: number) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${test.winner_variant_index === i ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-[#070510] border-[#1A1726]'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#E8970A]">Variant {v.label}</span>
                        {test.winner_variant_index === i && (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <Trophy size={12} />
                            Winner
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-3">{v.content}</p>
                      {test.status !== 'completed' && (
                        <button
                          onClick={() => markWinner(test.id, i)}
                          className="mt-2 text-xs text-[#E8970A] hover:underline"
                        >
                          Mark as winner
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Create A/B Test</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Test name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Diwali post copy test" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Metric to optimize</label>
                  <select value={metric} onChange={(e) => setMetric(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white">
                    <option value="engagement">Engagement (likes + comments + shares)</option>
                    <option value="clicks">Clicks</option>
                    <option value="impressions">Impressions</option>
                    <option value="conversions">Conversions</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-gray-400">Variants</label>
                    {variants.length < 4 && (
                      <button onClick={addVariant} className="text-xs text-[#E8970A] hover:underline">+ Add Variant</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i}>
                        <div className="text-xs text-[#E8970A] mb-1">Variant {v.label}</div>
                        <textarea
                          value={v.content}
                          onChange={(e) => {
                            const next = [...variants]
                            next[i] = { ...v, content: e.target.value }
                            setVariants(next)
                          }}
                          rows={3}
                          placeholder="Post content..."
                          className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={createTest} className="flex-1 py-2 rounded-lg text-sm bg-[#E8970A] text-black font-medium hover:opacity-90">Create Test</button>
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5">Cancel</button>
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
