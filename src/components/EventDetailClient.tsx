'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Search } from 'lucide-react'
import QRCode from '@/components/QRCode'
import type { TicketAction } from '@/lib/ticketUrl'

interface EventDetailClientProps {
  shortUrl: string
  ticketAction?: TicketAction | null
}

export default function EventDetailClient({ shortUrl, ticketAction }: EventDetailClientProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shortUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tickets CTA — label and helper text depend on whether we have a
          direct buy link or a search fallback */}
      {ticketAction && (
        <div>
          <a
            href={ticketAction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-8 py-3 rounded-xl text-black font-semibold text-lg transition-all shadow-lg shadow-black/40 hover:brightness-110 hover:shadow-[0_10px_30px_-10px_rgba(232,151,10,0.6)]"
            style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
          >
            {ticketAction.kind === 'direct' ? (
              <ExternalLink size={20} className="transition-transform group-hover:translate-x-0.5" />
            ) : (
              <Search size={20} />
            )}
            {ticketAction.label}
          </a>
          {ticketAction.kind === 'search' && (
            <p
              className="mt-2 text-xs text-gray-500 max-w-xs"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              We'll search the web for current ticket links and RSVPs for this event.
            </p>
          )}
        </div>
      )}

      {/* QR Code & Short URL */}
      <div
        className="rounded-xl border p-6 space-y-4 inline-block"
        style={{ backgroundColor: '#0F0D1A', borderColor: '#1A1726' }}
      >
        <p
          className="text-sm text-gray-400"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Share this event
        </p>

        <QRCode data={shortUrl} size={160} />

        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-300 truncate"
            style={{ backgroundColor: '#070510', fontFamily: 'DM Sans, sans-serif' }}
          >
            {shortUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 rounded-lg border transition-all hover:border-gray-500"
            style={{ borderColor: '#1A1726' }}
            title="Copy URL"
          >
            {copied ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <Copy size={16} className="text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
