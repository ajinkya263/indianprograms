'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, ImageOff } from 'lucide-react'

interface PreviewData {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

interface LinkPreviewProps {
  href: string
  children: React.ReactNode
  className?: string
  enabled?: boolean
  /** How long the pointer must dwell before we fetch (ms). */
  delay?: number
}

// Module-level cache — hovering the same link twice never refetches.
const cache = new Map<string, PreviewData | 'error'>()
const inflight = new Map<string, Promise<PreviewData | null>>()

async function loadPreview(url: string): Promise<PreviewData | null> {
  const cached = cache.get(url)
  if (cached === 'error') return null
  if (cached) return cached
  if (inflight.has(url)) return inflight.get(url)!

  const p = (async () => {
    try {
      const r = await fetch(`/api/preview?url=${encodeURIComponent(url)}`)
      if (!r.ok) { cache.set(url, 'error'); return null }
      const data = (await r.json()) as PreviewData
      cache.set(url, data)
      return data
    } catch {
      cache.set(url, 'error')
      return null
    } finally {
      inflight.delete(url)
    }
  })()
  inflight.set(url, p)
  return p
}

// Card dimensions used for viewport positioning math.
const CARD_W = 512
const CARD_H_ESTIMATE = 380

export default function LinkPreview({
  href,
  children,
  className,
  enabled = true,
  delay = 350,
}: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function computePosition() {
    const el = wrapperRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const spaceBelow = vh - rect.bottom
    const placeAbove = spaceBelow < CARD_H_ESTIMATE && rect.top > spaceBelow

    // Clamp horizontally so the 512px card never falls off the viewport.
    const desiredLeft = rect.left
    const clampedLeft = Math.max(8, Math.min(desiredLeft, vw - CARD_W - 8))

    const top = placeAbove ? rect.top - 8 : rect.bottom + 8
    setPos({ top, left: clampedLeft, placeAbove })
  }

  function onEnter() {
    if (!enabled) return
    computePosition()
    setVisible(true)

    const cached = cache.get(href)
    if (cached === 'error') { setState('error'); return }
    if (cached) { setPreview(cached); setState('ready'); return }

    setState('loading')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const p = await loadPreview(href)
      if (p) { setPreview(p); setState('ready') }
      else setState('error')
    }, delay)
  }

  function onLeave() {
    setVisible(false)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  // Reposition on scroll/resize while visible so the card tracks the link.
  useEffect(() => {
    if (!visible) return
    const handler = () => computePosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [visible])

  const cardMotion = pos ? (
    <motion.div
      initial={{ opacity: 0, y: pos.placeAbove ? 6 : -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: pos.placeAbove ? 6 : -6, scale: 0.98 }}
      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="w-[512px] max-w-[92vw] rounded-xl border border-[#1A1726] bg-[#0F0D1A] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden pointer-events-none"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: pos.placeAbove ? 'translateY(-100%)' : undefined,
        fontFamily: 'DM Sans, sans-serif',
        zIndex: 1000,
      }}
    >
      {state === 'loading' && (
        <div className="p-4">
          <div className="h-56 w-full rounded skeleton-shimmer mb-3" />
          <div className="h-4 w-3/4 rounded skeleton-shimmer mb-2" />
          <div className="h-3 w-full rounded skeleton-shimmer mb-1.5" />
          <div className="h-3 w-5/6 rounded skeleton-shimmer" />
        </div>
      )}

      {state === 'error' && (
        <div className="p-4 flex items-center gap-2 text-sm text-gray-400">
          <ImageOff size={16} />
          <span>Preview blocked by target site</span>
        </div>
      )}

      {state === 'ready' && preview && (
        <div>
          {preview.image ? (
            <img
              src={preview.image}
              alt=""
              className="w-full h-56 object-cover bg-[#070510]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : null}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500">
              <ExternalLink size={11} />
              <span className="truncate">{preview.siteName}</span>
            </div>
            {preview.title && (
              <div className="text-base font-semibold text-white line-clamp-2 leading-snug">
                {preview.title}
              </div>
            )}
            {preview.description && (
              <div className="text-sm text-gray-400 line-clamp-5 leading-relaxed">
                {preview.description}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  ) : null

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>

      {/* Portal so the preview can float over any ancestor's overflow:hidden */}
      {mounted && createPortal(
        <AnimatePresence>{visible && cardMotion}</AnimatePresence>,
        document.body,
      )}
    </span>
  )
}
