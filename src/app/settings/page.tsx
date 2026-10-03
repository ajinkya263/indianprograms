'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Profile {
  id: string
  name: string
  bio: string
  slug: string
  role: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [slug, setSlug] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      setProfile(data)
      setName(data.name || '')
      setBio(data.bio || '')
      setSlug(data.slug || '')
      setRole(data.role || '')
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name, bio, slug })
      .eq('id', profile?.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSuccess('Profile updated successfully')
    setSaving(false)

    setTimeout(() => setSuccess(''), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron/10">
                <User className="h-5 w-5 text-saffron" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-white">
                  Profile Settings
                </h1>
                <p className="text-gray-400 font-body text-sm">
                  Manage your publisher profile
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Role
                </label>
                <span className="inline-block rounded-full bg-saffron/10 border border-saffron/30 px-3 py-1 text-xs font-medium text-saffron capitalize">
                  {role}
                </span>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full rounded-lg border border-dark-border bg-dark-surface px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself or your organization"
                  className="w-full rounded-lg border border-dark-border bg-dark-surface px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors resize-none"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Slug
                </label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="your-public-url"
                  className="w-full rounded-lg border border-dark-border bg-dark-surface px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be your public publisher URL
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-2.5 text-sm font-semibold text-dark hover:bg-saffron-light focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
