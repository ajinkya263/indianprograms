'use client'

import { useState } from 'react'
import { Sparkles, Wand2, Check, Loader2 } from 'lucide-react'

interface StoryWeaverProps {
  initialContent?: string
  platforms: string[]
  onVersionsGenerated: (versions: Record<string, string>) => void
}

const PLATFORM_META: Record<
  string,
  { color: string; limit: number; label: string }
> = {
  twitter: { color: '#1DA1F2', limit: 280, label: 'Twitter' },
  facebook: { color: '#1877F2', limit: 63206, label: 'Facebook' },
  instagram: { color: '#E1306C', limit: 2200, label: 'Instagram' },
  linkedin: { color: '#0A66C2', limit: 3000, label: 'LinkedIn' },
  threads: { color: '#FFFFFF', limit: 500, label: 'Threads' },
  tiktok: { color: '#FF0050', limit: 2200, label: 'TikTok' },
  youtube: { color: '#FF0000', limit: 5000, label: 'YouTube' },
}

export default function StoryWeaver({
  initialContent = '',
  platforms,
  onVersionsGenerated,
}: StoryWeaverProps) {
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [versions, setVersions] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState<Record<string, boolean>>({})

  const weave = async () => {
    if (!content.trim() || content.trim().length < 5) {
      setError('Please enter at least 5 characters of content.')
      return
    }
    if (platforms.length === 0) {
      setError('Select at least one platform first.')
      return
    }
    setError('')
    setLoading(true)
    setApplied({})
    try {
      const res = await fetch('/api/social/story-weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platforms }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to weave story')
      setVersions(data.versions || {})
      onVersionsGenerated(data.versions || {})
    } catch (err: any) {
      setError(err.message || 'Failed to weave story')
    } finally {
      setLoading(false)
    }
  }

  const applyOne = (platform: string, text: string) => {
    onVersionsGenerated({ [platform]: text })
    setApplied((prev) => ({ ...prev, [platform]: true }))
    setTimeout(() => {
      setApplied((prev) => ({ ...prev, [platform]: false }))
    }, 1500)
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1030] to-[#0f0820] border border-[#E8970A]/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 size={18} className="text-[#E8970A]" />
        <h3 className="font-semibold text-white">Story Weaver</h3>
        <span className="text-xs text-gray-400 ml-2">
          One story, every platform — native style
        </span>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">
          Your story (write once)
        </label>
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your event, milestone, or update. Story Weaver will tailor it for each platform."
          className="w-full bg-[#070510] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-[#E8970A]/50 focus:outline-none text-sm resize-y"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400">Will generate for:</span>
        {platforms.length === 0 ? (
          <span className="text-xs text-gray-500 italic">
            No platforms selected
          </span>
        ) : (
          platforms.map((p) => {
            const meta = PLATFORM_META[p]
            return (
              <span
                key={p}
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: (meta?.color || '#E8970A') + '66',
                  color: meta?.color || '#E8970A',
                }}
              >
                {meta?.label || p}
              </span>
            )
          })
        )}
      </div>

      <button
        type="button"
        onClick={weave}
        disabled={loading || platforms.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8970A] hover:bg-[#E8970A]/90 text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Weaving...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Weave Story
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {Object.keys(versions).length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            Platform Versions
          </div>
          {Object.entries(versions).map(([platform, text]) => {
            const meta = PLATFORM_META[platform]
            const count = text.length
            const over = meta && count > meta.limit
            return (
              <div
                key={platform}
                className="bg-[#070510] border border-white/10 rounded-lg p-3 space-y-2"
                style={{ borderLeftColor: meta?.color || '#E8970A', borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: meta?.color || '#E8970A' }}
                  >
                    {meta?.label || platform}
                  </span>
                  <span
                    className={`text-xs ${
                      over ? 'text-red-400' : 'text-gray-500'
                    }`}
                  >
                    {count}
                    {meta ? ` / ${meta.limit}` : ''} chars
                  </span>
                </div>
                <div className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                  {text}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => applyOne(platform, text)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#E8970A]/20 hover:bg-[#E8970A]/30 text-[#E8970A] border border-[#E8970A]/30 transition"
                  >
                    {applied[platform] ? (
                      <>
                        <Check size={12} /> Applied
                      </>
                    ) : (
                      <>Use This</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
