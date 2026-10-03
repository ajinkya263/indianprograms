'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Palette, Save, Upload, Image as ImageIcon, Check } from 'lucide-react'

interface BrandAssets {
  id?: string
  brand_name: string
  logo_url: string
  watermark_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  tagline: string
  default_signature: string
  default_hashtags: string
  contact_email: string
  contact_website: string
  watermark_position: string
  watermark_opacity: number
  watermark_size_percent: number
}

const DEFAULT_ASSETS: BrandAssets = {
  brand_name: '',
  logo_url: '',
  watermark_url: '',
  primary_color: '#E8970A',
  secondary_color: '#138808',
  accent_color: '#FFD700',
  tagline: '',
  default_signature: '',
  default_hashtags: '',
  contact_email: '',
  contact_website: '',
  watermark_position: 'bottom-right',
  watermark_opacity: 0.7,
  watermark_size_percent: 15,
}

export default function BrandAssetsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [assets, setAssets] = useState<BrandAssets>(DEFAULT_ASSETS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      const { data } = await supabase.from('brand_assets').select('*').eq('user_id', user.id).maybeSingle()
      if (data) setAssets(data as BrandAssets)
      setLoading(false)
    })
  }, [])

  const uploadImage = async (file: File, key: 'logo_url' | 'watermark_url') => {
    if (!userId) return
    const filePath = `social/${userId}/brand-${key}-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('post-images').upload(filePath, file)
    if (!error) {
      const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
      setAssets({ ...assets, [key]: data.publicUrl })
    }
  }

  const save = async () => {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.from('brand_assets').upsert({
      user_id: userId,
      ...assets,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      alert('Save failed: ' + error.message)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#070510] text-white flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <Palette size={28} />
            Brand Assets
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Centralize your brand identity for consistent posting</p>
        </div>

        <div className="space-y-6">
          {/* Brand Identity */}
          <section className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Brand Identity</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Brand name</label>
                <input type="text" value={assets.brand_name} onChange={(e) => setAssets({ ...assets, brand_name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tagline</label>
                <input type="text" value={assets.tagline} onChange={(e) => setAssets({ ...assets, tagline: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Logo</label>
                  {assets.logo_url ? (
                    <div className="flex items-center gap-2">
                      <img src={assets.logo_url} alt="Logo" className="w-16 h-16 object-contain bg-white rounded" />
                      <button onClick={() => setAssets({ ...assets, logo_url: '' })} className="text-xs text-red-400">Remove</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#070510] border border-dashed border-[#1A1726] text-sm text-gray-400 cursor-pointer hover:border-[#E8970A]/50">
                      <Upload size={14} />
                      Upload logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'logo_url') }} />
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Watermark image</label>
                  {assets.watermark_url ? (
                    <div className="flex items-center gap-2">
                      <img src={assets.watermark_url} alt="Watermark" className="w-16 h-16 object-contain bg-white rounded" />
                      <button onClick={() => setAssets({ ...assets, watermark_url: '' })} className="text-xs text-red-400">Remove</button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#070510] border border-dashed border-[#1A1726] text-sm text-gray-400 cursor-pointer hover:border-[#E8970A]/50">
                      <Upload size={14} />
                      Upload watermark
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'watermark_url') }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Brand Colors */}
          <section className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Brand Colors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Primary</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={assets.primary_color} onChange={(e) => setAssets({ ...assets, primary_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer" />
                  <input type="text" value={assets.primary_color} onChange={(e) => setAssets({ ...assets, primary_color: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Secondary</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={assets.secondary_color} onChange={(e) => setAssets({ ...assets, secondary_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer" />
                  <input type="text" value={assets.secondary_color} onChange={(e) => setAssets({ ...assets, secondary_color: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Accent</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={assets.accent_color} onChange={(e) => setAssets({ ...assets, accent_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer" />
                  <input type="text" value={assets.accent_color} onChange={(e) => setAssets({ ...assets, accent_color: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
              </div>
            </div>
          </section>

          {/* Watermark Settings */}
          <section className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Watermark Settings</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Position</label>
                <select value={assets.watermark_position} onChange={(e) => setAssets({ ...assets, watermark_position: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white">
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Opacity: {Math.round(assets.watermark_opacity * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={assets.watermark_opacity} onChange={(e) => setAssets({ ...assets, watermark_opacity: parseFloat(e.target.value) })} className="w-full accent-[#E8970A]" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Size: {assets.watermark_size_percent}% of image</label>
                <input type="range" min="5" max="30" value={assets.watermark_size_percent} onChange={(e) => setAssets({ ...assets, watermark_size_percent: parseInt(e.target.value) })} className="w-full accent-[#E8970A]" />
              </div>
            </div>
          </section>

          {/* Defaults */}
          <section className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Post Defaults</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Default signature</label>
                <textarea value={assets.default_signature} onChange={(e) => setAssets({ ...assets, default_signature: e.target.value })} placeholder="e.g., — Posted by IndianPrograms ✨" rows={2} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Default hashtags</label>
                <input type="text" value={assets.default_hashtags} onChange={(e) => setAssets({ ...assets, default_hashtags: e.target.value })} placeholder="#indianprograms #culturalevents" className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm font-mono" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Contact email</label>
                  <input type="email" value={assets.contact_email} onChange={(e) => setAssets({ ...assets, contact_email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Website</label>
                  <input type="text" value={assets.contact_website} onChange={(e) => setAssets({ ...assets, contact_website: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm" />
                </div>
              </div>
            </div>
          </section>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8970A] text-black font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Brand Assets'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
