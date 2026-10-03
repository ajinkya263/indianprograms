'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Settings, Check, X } from 'lucide-react'

interface FeatureFlag {
  id: string
  key: string
  label: string
  description: string
  category: string
  enabled: boolean
  icon: string
  href: string
  sort_order: number
}

export default function FeatureFlagsAdmin() {
  const router = useRouter()
  const supabase = createClient()
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') return router.push('/')

      const { data } = await supabase.from('feature_flags').select('*').order('category').order('sort_order')
      setFlags((data || []) as FeatureFlag[])
      setLoading(false)
    })
  }, [])

  const toggle = async (flag: FeatureFlag) => {
    setSavingId(flag.id)
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: !flag.enabled, updated_at: new Date().toISOString() })
      .eq('id', flag.id)
    if (!error) {
      setFlags(flags.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
    } else {
      alert('Failed: ' + error.message)
    }
    setSavingId(null)
  }

  // Group by category
  const grouped = flags.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = []
    acc[f.category].push(f)
    return acc
  }, {} as Record<string, FeatureFlag[]>)

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <Settings size={28} />
            Feature Flags
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Enable or disable features site-wide</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, categoryFlags]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{category}</h2>
                <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl divide-y divide-[#1A1726]">
                  {categoryFlags.map(flag => (
                    <div key={flag.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{flag.label}</h3>
                          <code className="text-xs text-gray-600">{flag.key}</code>
                        </div>
                        {flag.description && <p className="text-sm text-gray-500 mt-1">{flag.description}</p>}
                        {flag.href && <p className="text-xs text-gray-600 mt-1">→ {flag.href}</p>}
                      </div>
                      <button
                        onClick={() => toggle(flag)}
                        disabled={savingId === flag.id}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${flag.enabled ? 'bg-[#E8970A]' : 'bg-[#1A1726]'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
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
