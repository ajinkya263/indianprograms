'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { PLATFORMS, type SocialAccount, type PlatformKey } from '@/lib/social-types'
import {
  AtSign,
  Music2,
  Plus,
  X,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number | string; color?: string }>> = {
  facebook: AtSign,
  instagram: AtSign,
  twitter: AtSign,
  threads: AtSign,
  linkedin: AtSign,
  tiktok: Music2,
  youtube: AtSign,
}

function PlatformIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  const Icon = iconMap[platform] || AtSign
  const meta = PLATFORMS.find((p) => p.key === platform)
  return <Icon size={size} color={meta?.color || '#ffffff'} />
}

function AccountsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null)
  const [form, setForm] = useState({ account_name: '', account_handle: '', avatar_url: '' })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Handle OAuth callback result
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success) {
      setSuccessMsg(success)
      setTimeout(() => setSuccessMsg(''), 5000)
    }
    if (error) {
      setErrorMsg(error)
      setTimeout(() => setErrorMsg(''), 8000)
    }
  }, [searchParams])

  const handleConnectClick = (platform: PlatformKey) => {
    if (platform === 'facebook' || platform === 'instagram') {
      // Use real OAuth flow for Meta
      window.location.href = '/api/social/oauth/meta/start'
      return
    }
    // Other platforms: use manual form (mock)
    openConnect(platform)
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      await fetchAccounts(user.id)
      setLoading(false)
    }
    load()
  }, [])

  const fetchAccounts = async (uid: string) => {
    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', uid)
      .order('connected_at', { ascending: false })
    setAccounts((data as SocialAccount[]) || [])
  }

  const toggleActive = async (acc: SocialAccount) => {
    await supabase
      .from('social_accounts')
      .update({ is_active: !acc.is_active })
      .eq('id', acc.id)
    if (userId) await fetchAccounts(userId)
  }

  const disconnect = async (acc: SocialAccount) => {
    if (!confirm(`Disconnect ${acc.account_name}?`)) return
    await supabase.from('social_accounts').delete().eq('id', acc.id)
    if (userId) await fetchAccounts(userId)
  }

  const openConnect = (platform: PlatformKey) => {
    setSelectedPlatform(platform)
    setForm({ account_name: '', account_handle: '', avatar_url: '' })
  }

  const submitConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !selectedPlatform) return
    setSubmitting(true)

    // Call server-side API which encrypts tokens before storing
    const response = await fetch('/api/social/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: selectedPlatform,
        account_name: form.account_name,
        account_handle: form.account_handle,
        avatar_url: form.avatar_url,
        external_account_id: `mock_${Date.now()}`,
        access_token: `mock_token_${Math.random().toString(36).slice(2)}`,
        refresh_token: `mock_refresh_${Math.random().toString(36).slice(2)}`,
      }),
    })

    setSubmitting(false)
    if (response.ok) {
      setSuccessMsg(`Connected ${form.account_name} on ${selectedPlatform}`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setSelectedPlatform(null)
      setPickerOpen(false)
      await fetchAccounts(userId)
    } else {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }))
      alert('Failed to connect: ' + (err.error || 'Unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-[#070510] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/social"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          <ArrowLeft size={16} />
          Back to Social Hub
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Connected <span style={{ color: '#E8970A' }}>Accounts</span>
            </h1>
            <p
              className="text-gray-400 mt-2"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Manage the social accounts you publish to.
            </p>
          </div>
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-black transition-colors"
            style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
          >
            <Plus size={18} />
            Connect New Account
          </button>
        </div>

        {/* Notice */}
        <div
          className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 mb-8"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-100">
            <strong>Facebook & Instagram</strong> use real OAuth — click Connect to authorize via Meta.
            Other platforms still use manual connection until OAuth is added.
          </div>
        </div>

        {successMsg && (
          <div
            className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4 mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <CheckCircle2 size={18} className="text-green-400" />
            <div className="text-sm text-green-100">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div
            className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <AlertCircle size={18} className="text-red-400" />
            <div className="text-sm text-red-100">{errorMsg}</div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : accounts.length === 0 ? (
          <div
            className="text-center py-20 rounded-xl bg-[#0F0D1A] border border-[#1A1726]"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <div className="text-lg text-gray-300 mb-2">No accounts connected</div>
            <div className="text-sm text-gray-500 mb-6">
              Connect your first account to start posting.
            </div>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-black"
              style={{ backgroundColor: '#E8970A' }}
            >
              <Plus size={18} />
              Connect Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const meta = PLATFORMS.find((p) => p.key === acc.platform)
              return (
                <div
                  key={acc.id}
                  className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-5"
                  style={{ borderTop: `3px solid ${meta?.color || '#E8970A'}` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    {acc.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={acc.avatar_url}
                        alt={acc.account_name}
                        className="w-12 h-12 rounded-full object-cover border border-[#1A1726]"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${meta?.color || '#E8970A'}20` }}
                      >
                        <PlatformIcon platform={acc.platform} size={22} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="flex items-center gap-2 mb-1"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <PlatformIcon platform={acc.platform} size={14} />
                        <span className="text-xs uppercase tracking-wide text-gray-400">
                          {meta?.label}
                        </span>
                      </div>
                      <div
                        className="font-semibold truncate"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        {acc.account_name}
                      </div>
                      <div
                        className="text-sm text-gray-400 truncate"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {acc.account_handle}
                      </div>
                    </div>
                  </div>

                  <div
                    className="text-xs text-gray-500 mb-4"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Connected {new Date(acc.connected_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label
                      className="flex items-center gap-2 cursor-pointer select-none"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleActive(acc)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          acc.is_active ? 'bg-[#E8970A]' : 'bg-[#2A2640]'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            acc.is_active ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-gray-300">
                        {acc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>

                    <button
                      onClick={() => disconnect(acc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      <Trash2 size={14} />
                      Disconnect
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Platform picker modal */}
      {pickerOpen && !selectedPlatform && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-[#0F0D1A] border border-[#1A1726] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-2xl font-bold"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Connect a Platform
              </h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORMS.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-3 rounded-xl border border-[#1A1726] p-4 hover:border-[#E8970A]/40 transition-colors"
                  style={{ borderLeft: `3px solid ${p.color}` }}
                >
                  <PlatformIcon platform={p.key} size={22} />
                  <div
                    className="flex-1"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    <div className="text-sm font-medium">{p.label}</div>
                  </div>
                  <button
                    onClick={() => handleConnectClick(p.key as PlatformKey)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-black"
                    style={{ backgroundColor: '#E8970A' }}
                  >
                    {p.key === 'facebook' || p.key === 'instagram' ? 'OAuth' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Connect form modal */}
      {selectedPlatform && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPlatform(null)}
        >
          <form
            onSubmit={submitConnect}
            className="w-full max-w-[calc(100vw-2rem)] md:max-w-md rounded-2xl bg-[#0F0D1A] border border-[#1A1726] p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={selectedPlatform} size={22} />
                <h3
                  className="text-xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Connect {PLATFORMS.find((p) => p.key === selectedPlatform)?.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Account Name</label>
                <input
                  required
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                  className="w-full rounded-lg bg-[#070510] border border-[#1A1726] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8970A]"
                  placeholder="IndianPrograms Official"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Account Handle</label>
                <input
                  required
                  value={form.account_handle}
                  onChange={(e) => setForm({ ...form, account_handle: e.target.value })}
                  className="w-full rounded-lg bg-[#070510] border border-[#1A1726] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8970A]"
                  placeholder="@indianprograms"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Avatar URL</label>
                <input
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  className="w-full rounded-lg bg-[#070510] border border-[#1A1726] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8970A]"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-black disabled:opacity-60"
                style={{ backgroundColor: '#E8970A' }}
              >
                {submitting ? 'Connecting...' : 'Connect Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070510] text-white flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <AccountsInner />
    </Suspense>
  )
}
