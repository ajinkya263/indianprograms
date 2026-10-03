'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Link2 } from 'lucide-react'

interface Props {
  profileUrl: string
}

export default function PublisherProfileClient({ profileUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = profileUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my events on IndianPrograms',
          url: profileUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-2">
      {/* URL display with copy */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ backgroundColor: '#070510', borderColor: '#1A1726' }}
      >
        <Link2 size={14} className="text-gray-500 flex-shrink-0" />
        <span
          className="text-sm text-gray-400 truncate max-w-[200px]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {profileUrl.replace(/^https?:\/\//, '')}
        </span>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Copy URL"
        >
          {copied ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} className="text-gray-500 hover:text-white" />
          )}
        </button>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 border border-[#1A1726] hover:bg-white/5 hover:text-white transition-colors w-full justify-center"
      >
        <Share2 size={12} />
        Share Profile
      </button>
    </div>
  )
}
