'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ImageOff } from 'lucide-react'

interface EventPosterProps {
  src: string
  alt: string
}

/**
 * Detail-page poster.
 * - Full uncropped poster (object-contain), capped at 72vh for layout sanity.
 * - Click → lightbox at full resolution.
 * - Robust loading: programmatically preloads the image and listens for either
 *   load or error. Guarantees the skeleton clears (no infinite spinner if the
 *   src is cached, broken, or CORS-restricted).
 */
export default function EventPoster({ src, alt }: EventPosterProps) {
  const [zoomed, setZoomed] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const imgRef = useRef<HTMLImageElement>(null)

  // Preload via a detached Image() so we always learn the outcome,
  // even when the <img> in JSX never fires onLoad (cached / CORS quirks).
  useEffect(() => {
    if (!src) {
      setStatus('error')
      return
    }
    setStatus('loading')

    // Fast path: if the rendered img is already complete from cache, mark ready.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setStatus('ready')
      return
    }

    const preload = new Image()
    let cancelled = false
    preload.onload = () => { if (!cancelled) setStatus('ready') }
    preload.onerror = () => { if (!cancelled) setStatus('error') }
    preload.src = src

    // Safety net: if neither event fires in 8s, clear the skeleton anyway.
    const timeout = setTimeout(() => { if (!cancelled) setStatus('ready') }, 8000)

    return () => {
      cancelled = true
      preload.onload = null
      preload.onerror = null
      clearTimeout(timeout)
    }
  }, [src])

  // Lock body scroll while zoomed; ESC to close
  useEffect(() => {
    if (!zoomed) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [zoomed])

  const showLoader = status === 'loading'
  const showImage = status !== 'error'

  return (
    <>
      <button
        type="button"
        onClick={() => status === 'ready' && setZoomed(true)}
        aria-label="View poster at full resolution"
        className="mb-8 group relative w-full overflow-hidden rounded-2xl border border-[#1A1726] bg-[#0A0814] block focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron/60"
        style={{ minHeight: 280 }}
      >
        {/* Blurred backdrop derived from the same source. */}
        {showImage && (
          <div
            aria-hidden
            className="absolute inset-0 bg-center bg-cover scale-110 blur-2xl opacity-40 pointer-events-none"
            style={{ backgroundImage: `url("${src}")` }}
          />
        )}

        {showImage && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={() => setStatus('ready')}
            onError={() => setStatus('error')}
            className={`relative z-10 mx-auto block max-h-[72vh] w-auto max-w-full object-contain transition-opacity duration-500 ${
              status === 'ready' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {showLoader && (
          <div className="absolute inset-0 z-20 skeleton-shimmer pointer-events-none" />
        )}

        {status === 'error' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-gray-500" style={{ minHeight: 280 }}>
            <ImageOff size={32} />
            <span className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Poster could not be loaded
            </span>
          </div>
        )}

        {status === 'ready' && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={14} />
            View full size
          </div>
        )}
      </button>

      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            onClick={() => setZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-out"
            />
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close poster"
              className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm backdrop-blur-md transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Open original
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
