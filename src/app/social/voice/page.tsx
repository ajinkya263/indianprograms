'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Wand2, Plus, Trash2, RefreshCw, Save } from 'lucide-react'

interface VoiceProfile {
  id: string
  user_id: string
  brand_name: string | null
  brand_description: string | null
  sample_posts: string[] | null
  detected_tone: string | null
  detected_style: string | null
  vocabulary_keywords: string[] | null
  emoji_usage: string | null
  hashtag_style: string | null
  voice_summary: string | null
  last_analyzed_at: string | null
}

export default function VoiceProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<VoiceProfile | null>(null)
  const [brandName, setBrandName] = useState('')
  const [brandDescription, setBrandDescription] = useState('')
  const [samples, setSamples] = useState<string[]>(['', '', ''])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setProfile(data as VoiceProfile)
        setBrandName(data.brand_name || '')
        setBrandDescription(data.brand_description || '')
        setSamples(data.sample_posts && data.sample_posts.length >= 3 ? data.sample_posts : ['', '', ''])
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSample = (idx: number, value: string) => {
    setSamples((s) => s.map((v, i) => (i === idx ? value : v)))
  }
  const addSample = () => {
    if (samples.length < 10) setSamples((s) => [...s, ''])
  }
  const removeSample = (idx: number) => {
    if (samples.length > 3) setSamples((s) => s.filter((_, i) => i !== idx))
  }

  const analyze = async () => {
    setError(null)
    const cleanSamples = samples.map((s) => s.trim()).filter((s) => s.length > 0)
    if (cleanSamples.length < 3) {
      setError('Please add at least 3 sample posts.')
      return
    }
    if (!brandName.trim()) {
      setError('Please enter a brand name.')
      return
    }
    setAnalyzing(true)
    try {
      const res = await fetch('/api/social/voice-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          brand_description: brandDescription.trim(),
          sample_posts: cleanSamples,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Analysis failed')
      } else {
        setProfile(data.profile)
        setEditMode(false)
      }
    } catch (e: any) {
      setError(e.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const resetProfile = async () => {
    if (!confirm('Delete your voice profile? This cannot be undone.')) return
    const res = await fetch('/api/social/voice-analyze', { method: 'DELETE' })
    if (res.ok) {
      setProfile(null)
      setBrandName('')
      setBrandDescription('')
      setSamples(['', '', ''])
      setEditMode(false)
    }
  }

  const startEdit = () => {
    setEditMode(true)
    if (profile) {
      setBrandName(profile.brand_name || '')
      setBrandDescription(profile.brand_description || '')
      setSamples(profile.sample_posts && profile.sample_posts.length >= 3 ? profile.sample_posts : ['', '', ''])
    }
  }

  const showSetup = !profile || editMode

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <Navbar />

      <section className="relative border-b border-white/5 bg-gradient-to-b from-[#0F0D1A] to-[#070510]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles size={24} style={{ color: '#E8970A' }} />
            <span
              className="text-sm uppercase tracking-wider"
              style={{ color: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
            >
              AI Content DNA
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            AI <span style={{ color: '#E8970A' }}>Voice Profile</span>
          </h1>
          <p
            className="text-lg text-gray-400 max-w-2xl"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Train AI to write in your unique brand voice.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            <div
              className="mb-8 rounded-xl border border-[#E8970A]/30 bg-[#E8970A]/5 px-5 py-4 flex items-center gap-3"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Wand2 size={18} style={{ color: '#E8970A' }} />
              <span className="text-sm text-gray-200">
                All AI-generated posts will now match your brand voice automatically.
              </span>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {showSetup ? (
              <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 md:p-8">
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {profile ? 'Update Voice Training' : 'Getting Started'}
                </h2>

                <div className="space-y-5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Brand Name</label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g., Desi Beats Events"
                      className="w-full rounded-lg bg-[#070510] border border-[#1A1726] px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E8970A]/60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Brand Description (1-2 sentences)
                    </label>
                    <textarea
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      rows={2}
                      placeholder="What your brand is about..."
                      className="w-full rounded-lg bg-[#070510] border border-[#1A1726] px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E8970A]/60"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-gray-300">
                        Sample Posts ({samples.length}/10) — min 3
                      </label>
                      <button
                        onClick={addSample}
                        disabled={samples.length >= 10}
                        className="inline-flex items-center gap-1 text-xs text-[#E8970A] hover:text-[#ffb13e] disabled:opacity-40"
                      >
                        <Plus size={14} /> Add Sample Post
                      </button>
                    </div>
                    <div className="space-y-3">
                      {samples.map((s, i) => (
                        <div key={i} className="relative">
                          <textarea
                            value={s}
                            onChange={(e) => updateSample(i, e.target.value)}
                            rows={3}
                            placeholder={`Paste a past post from your brand (#${i + 1})`}
                            className="w-full rounded-lg bg-[#070510] border border-[#1A1726] px-4 py-3 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#E8970A]/60"
                          />
                          {samples.length > 3 && (
                            <button
                              onClick={() => removeSample(i)}
                              className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={analyze}
                      disabled={analyzing}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#E8970A] hover:bg-[#ffb13e] disabled:opacity-50 text-black font-semibold px-5 py-3"
                    >
                      <Wand2 size={18} />
                      {analyzing ? 'Analyzing...' : 'Analyze My Voice'}
                    </button>
                    {profile && (
                      <button
                        onClick={() => setEditMode(false)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#1A1726] hover:border-white/20 text-gray-300 px-5 py-3"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className="text-xs uppercase tracking-wider text-gray-500 mb-2"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Brand
                      </div>
                      <h2
                        className="text-3xl font-bold mb-2"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {profile.brand_name || 'Untitled Brand'}
                      </h2>
                      {profile.brand_description && (
                        <p
                          className="text-gray-400"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          {profile.brand_description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles size={18} style={{ color: '#E8970A' }} />
                    <h3
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      Detected Voice
                    </h3>
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Primary Tone
                      </div>
                      <div className="text-lg text-white capitalize">
                        {profile.detected_tone || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Style
                      </div>
                      <div className="text-lg text-white">{profile.detected_style || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Emoji Habits
                      </div>
                      <div className="text-base text-gray-200">{profile.emoji_usage || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                        Hashtag Style
                      </div>
                      <div className="text-base text-gray-200">{profile.hashtag_style || '—'}</div>
                    </div>
                  </div>

                  {profile.vocabulary_keywords && profile.vocabulary_keywords.length > 0 && (
                    <div className="mt-6">
                      <div
                        className="text-xs uppercase tracking-wider text-gray-500 mb-2"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        Frequent Vocabulary
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.vocabulary_keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-[#E8970A]/10 border border-[#E8970A]/30 text-[#ffb13e] px-3 py-1 text-sm"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.voice_summary && (
                    <blockquote
                      className="mt-6 border-l-4 border-[#E8970A] bg-[#E8970A]/5 pl-5 pr-4 py-4 italic text-gray-200"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      "{profile.voice_summary}"
                    </blockquote>
                  )}

                  {profile.last_analyzed_at && (
                    <div
                      className="mt-6 text-xs text-gray-500"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      Last analyzed: {new Date(profile.last_analyzed_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#1A1726] hover:border-[#E8970A]/60 text-white px-5 py-3"
                  >
                    <Plus size={18} /> Add More Samples
                  </button>
                  <button
                    onClick={analyze}
                    disabled={analyzing}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#E8970A] hover:bg-[#ffb13e] disabled:opacity-50 text-black font-semibold px-5 py-3"
                  >
                    <RefreshCw size={18} /> {analyzing ? 'Re-analyzing...' : 'Re-analyze'}
                  </button>
                  <button
                    onClick={resetProfile}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 px-5 py-3"
                  >
                    <Trash2 size={18} /> Reset Profile
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
