'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Upload, Type, Frame, Sparkles, Download, Save, Palette, RefreshCw } from 'lucide-react'

const TEMPLATES = [
  { key: 'diwali', label: '🪔 Diwali Special', overlayColor: 'rgba(232,151,10,0.5)', textColor: '#FFD700', text: 'DIWALI SPECIAL' },
  { key: 'concert', label: '🎤 Concert Poster', overlayColor: 'rgba(0,0,0,0.6)', textColor: '#FFFFFF', text: 'LIVE CONCERT' },
  { key: 'workshop', label: '🎨 Workshop', overlayColor: 'rgba(255,255,255,0.85)', textColor: '#000000', text: 'WORKSHOP' },
  { key: 'festival', label: '🎉 Festival', overlayColor: 'rgba(216,67,21,0.5)', textColor: '#FFFFFF', text: 'FESTIVAL' },
  { key: 'navratri', label: '💃 Navratri', overlayColor: 'rgba(156,39,176,0.5)', textColor: '#FFD700', text: 'NAVRATRI NIGHTS' },
]

const ASPECTS = [
  { key: 'square', label: 'Instagram (1:1)', w: 1080, h: 1080 },
  { key: 'landscape', label: 'Facebook (16:9)', w: 1200, h: 675 },
  { key: 'portrait', label: 'Story (9:16)', w: 1080, h: 1920 },
  { key: 'twitter', label: 'Twitter (2:1)', w: 1200, h: 600 },
]

const FILTERS = [
  { key: 'none', label: 'Original', filter: 'none' },
  { key: 'warm', label: 'Warm', filter: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)' },
  { key: 'cool', label: 'Cool', filter: 'saturate(1.2) hue-rotate(15deg) brightness(1.05)' },
  { key: 'vibrant', label: 'Vibrant', filter: 'saturate(1.5) contrast(1.15)' },
  { key: 'vintage', label: 'Vintage', filter: 'sepia(0.5) contrast(0.9) brightness(0.95)' },
  { key: 'mono', label: 'B&W', filter: 'grayscale(1) contrast(1.1)' },
]

export default function ImageStudioPage() {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)

  // Editing state
  const [overlayText, setOverlayText] = useState('')
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [textSize, setTextSize] = useState(60)
  const [overlayColor, setOverlayColor] = useState('rgba(0,0,0,0)')
  const [filter, setFilter] = useState('none')
  const [frameStyle, setFrameStyle] = useState<'none' | 'simple' | 'festive' | 'tricolor'>('none')
  const [aspect, setAspect] = useState(ASPECTS[0])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => setImageObj(img)
  }, [imageSrc])

  // Re-render canvas whenever any setting changes
  useEffect(() => {
    if (!canvasRef.current || !imageObj) return
    const canvas = canvasRef.current
    canvas.width = aspect.w
    canvas.height = aspect.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Apply filter to image
    ctx.filter = FILTERS.find(f => f.key === filter)?.filter || 'none'

    // Calculate scale to cover
    const scale = Math.max(aspect.w / imageObj.width, aspect.h / imageObj.height)
    const sw = imageObj.width * scale
    const sh = imageObj.height * scale
    const sx = (aspect.w - sw) / 2
    const sy = (aspect.h - sh) / 2
    ctx.drawImage(imageObj, sx, sy, sw, sh)

    ctx.filter = 'none'

    // Overlay color
    if (overlayColor !== 'rgba(0,0,0,0)') {
      ctx.fillStyle = overlayColor
      ctx.fillRect(0, 0, aspect.w, aspect.h)
    }

    // Text overlay
    if (overlayText) {
      ctx.fillStyle = textColor
      ctx.font = `bold ${textSize}px "Playfair Display", serif`
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 8
      const x = aspect.w / 2
      const y = textPosition === 'top' ? textSize + 40 : textPosition === 'bottom' ? aspect.h - 40 : aspect.h / 2
      ctx.fillText(overlayText, x, y)
      ctx.shadowBlur = 0
    }

    // Frame
    if (frameStyle !== 'none') {
      const frameWidth = 20
      if (frameStyle === 'simple') {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = frameWidth
        ctx.strokeRect(frameWidth / 2, frameWidth / 2, aspect.w - frameWidth, aspect.h - frameWidth)
      } else if (frameStyle === 'festive') {
        const grad = ctx.createLinearGradient(0, 0, aspect.w, aspect.h)
        grad.addColorStop(0, '#FF9933')
        grad.addColorStop(0.5, '#FFD700')
        grad.addColorStop(1, '#FF9933')
        ctx.strokeStyle = grad
        ctx.lineWidth = frameWidth
        ctx.strokeRect(frameWidth / 2, frameWidth / 2, aspect.w - frameWidth, aspect.h - frameWidth)
      } else if (frameStyle === 'tricolor') {
        ctx.fillStyle = '#FF9933'
        ctx.fillRect(0, 0, aspect.w, frameWidth)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, frameWidth, aspect.w, frameWidth)
        ctx.fillStyle = '#138808'
        ctx.fillRect(0, frameWidth * 2, aspect.w, frameWidth)
        ctx.fillStyle = '#FF9933'
        ctx.fillRect(0, aspect.h - frameWidth * 3, aspect.w, frameWidth)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, aspect.h - frameWidth * 2, aspect.w, frameWidth)
        ctx.fillStyle = '#138808'
        ctx.fillRect(0, aspect.h - frameWidth, aspect.w, frameWidth)
      }
    }
  }, [imageObj, aspect, overlayText, textColor, textSize, textPosition, overlayColor, filter, frameStyle])

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const applyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setOverlayColor(tpl.overlayColor)
    setTextColor(tpl.textColor)
    setOverlayText(tpl.text)
  }

  const downloadPNG = () => {
    if (!canvasRef.current) return
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-studio-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const saveToBucket = async () => {
    if (!canvasRef.current || !userId) return
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return
      const filePath = `social/${userId}/${Date.now()}-studio.png`
      const { error } = await supabase.storage
        .from('post-images')
        .upload(filePath, blob, { contentType: 'image/png' })
      if (error) {
        alert('Save failed: ' + error.message)
        return
      }
      const { data } = supabase.storage.from('post-images').getPublicUrl(filePath)
      alert('Saved! URL: ' + data.publicUrl)
    }, 'image/png')
  }

  const resetAll = () => {
    setOverlayText('')
    setTextColor('#FFFFFF')
    setTextSize(60)
    setOverlayColor('rgba(0,0,0,0)')
    setFilter('none')
    setFrameStyle('none')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Image Magic Studio
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Create stunning visuals for your posts</p>
        </div>

        {!imageSrc ? (
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileUpload(f)
                }}
              />
              <div className="border-2 border-dashed border-[#1A1726] hover:border-[#E8970A]/50 rounded-xl p-16 text-center cursor-pointer">
                <Upload size={48} className="mx-auto text-gray-500 mb-3" />
                <p className="text-white font-medium mb-1">Upload an image</p>
                <p className="text-xs text-gray-500">JPG, PNG, or WebP</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tools panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-[#E8970A]" />
                  <h3 className="font-semibold text-white">Quick Templates</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.key}
                      onClick={() => applyTemplate(tpl)}
                      className="text-left px-3 py-2 rounded-lg text-xs bg-[#070510] border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors text-gray-300"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Type size={16} className="text-[#E8970A]" />
                  <h3 className="font-semibold text-white">Text Overlay</h3>
                </div>
                <input
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Add text..."
                  className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
                />
                <select
                  value={textPosition}
                  onChange={(e) => setTextPosition(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer" />
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={textSize}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    className="flex-1 accent-[#E8970A]"
                  />
                  <span className="text-xs text-gray-400 w-10">{textSize}px</span>
                </div>
              </div>

              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-[#E8970A]" />
                  <h3 className="font-semibold text-white">Filter</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`px-2 py-1.5 rounded-lg text-xs ${filter === f.key ? 'bg-[#E8970A] text-black' : 'bg-[#070510] border border-[#1A1726] text-gray-300'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Frame size={16} className="text-[#E8970A]" />
                  <h3 className="font-semibold text-white">Frame</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['none', 'simple', 'festive', 'tricolor'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFrameStyle(f)}
                      className={`px-2 py-1.5 rounded-lg text-xs ${frameStyle === f ? 'bg-[#E8970A] text-black' : 'bg-[#070510] border border-[#1A1726] text-gray-300'}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">Aspect Ratio</h3>
                <div className="grid grid-cols-1 gap-2">
                  {ASPECTS.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => setAspect(a)}
                      className={`px-3 py-1.5 rounded-lg text-xs text-left ${aspect.key === a.key ? 'bg-[#E8970A] text-black' : 'bg-[#070510] border border-[#1A1726] text-gray-300'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-6 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '600px' }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={downloadPNG}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8970A] text-black font-medium text-sm hover:opacity-90"
                >
                  <Download size={14} />
                  Download PNG
                </button>
                <button
                  onClick={saveToBucket}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm hover:bg-green-500/30"
                >
                  <Save size={14} />
                  Save to Library
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#070510] text-gray-400 border border-[#1A1726] text-sm hover:bg-white/5"
                >
                  <RefreshCw size={14} />
                  Reset
                </button>
                <button
                  onClick={() => { setImageSrc(''); setImageObj(null) }}
                  className="ml-auto px-4 py-2 rounded-lg text-gray-400 border border-[#1A1726] text-sm hover:bg-white/5"
                >
                  New Image
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
