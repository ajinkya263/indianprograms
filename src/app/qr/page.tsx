'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QRCodeLib from 'qrcode'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Download, Printer, Palette, Settings, Type, Copy, Check } from 'lucide-react'

type ECLevel = 'L' | 'M' | 'Q' | 'H'

const PRESETS = [
  { label: 'Event URL', value: 'https://indianprograms.com/events/' },
  { label: 'Profile URL', value: 'https://indianprograms.com/profile/' },
  { label: 'Custom URL', value: 'https://' },
  { label: 'Plain text', value: 'Hello from IndianPrograms' },
]

const COLOR_PRESETS = [
  { label: 'Saffron', value: '#FF9933' },
  { label: 'Green', value: '#138808' },
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Gold', value: '#E8970A' },
]

export default function QRStudioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [authChecked, setAuthChecked] = useState(false)

  const [data, setData] = useState('https://indianprograms.com')
  const [fgColor, setFgColor] = useState('#FFFFFF')
  const [bgColor, setBgColor] = useState('#070510')
  const [size, setSize] = useState(300)
  const [margin, setMargin] = useState(2)
  const [ecLevel, setEcLevel] = useState<ECLevel>('M')
  const [caption, setCaption] = useState('Scan to view event')
  const [captionSize, setCaptionSize] = useState(18)
  const [captionColor, setCaptionColor] = useState('#FFFFFF')
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !data) return
    QRCodeLib.toCanvas(canvasRef.current, data, {
      width: size,
      margin,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    }).catch((err) => console.error(err))
  }, [data, size, fgColor, bgColor, margin, ecLevel])

  const downloadPNG = async () => {
    const url = await QRCodeLib.toDataURL(data, {
      width: 1024,
      margin,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    })
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.png'
    a.click()
  }

  const downloadSVG = async () => {
    const svg = await QRCodeLib.toString(data, {
      type: 'svg',
      margin,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    })
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPrintReady = async () => {
    const qrUrl = await QRCodeLib.toDataURL(data, {
      width: 800,
      margin,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    })
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = caption ? 1150 : 1000
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 100, 100, 800, 800)
      if (caption) {
        ctx.fillStyle = captionColor
        ctx.font = `bold ${captionSize * 2}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(caption, canvas.width / 2, 980)
      }
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'qr-print.png'
      a.click()
    }
    img.src = qrUrl
  }

  const copyDataUrl = async () => {
    const url = await QRCodeLib.toDataURL(data, {
      width: size,
      margin,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    })
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#070510] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    )
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-sm text-white focus:outline-none focus:border-[#E8970A]'
  const labelCls = 'block text-xs text-gray-400 mb-1.5 uppercase tracking-wide'

  return (
    <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            QR Code Studio
          </h1>
          <p className="text-gray-400">Create custom QR codes for your events</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#E8970A] mb-2">
                <Type size={18} />
                <h3 className="font-semibold">Content</h3>
              </div>
              <div>
                <label className={labelCls}>URL or Text *</label>
                <input
                  type="text"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={inputCls}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className={labelCls}>Preset templates</label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setData(p.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[#1A1726] hover:border-[#E8970A] text-gray-300 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#E8970A] mb-2">
                <Palette size={18} />
                <h3 className="font-semibold">Colors</h3>
              </div>
              <div>
                <label className={labelCls}>Foreground</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-10 w-16 rounded border border-[#1A1726] bg-transparent" />
                  <input type="text" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className={inputCls} />
                </div>
                <div className="flex gap-2 mt-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setFgColor(c.value)}
                      className="w-8 h-8 rounded-full border-2 border-[#1A1726] hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-16 rounded border border-[#1A1726] bg-transparent" />
                  <input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#E8970A] mb-2">
                <Settings size={18} />
                <h3 className="font-semibold">Settings</h3>
              </div>
              <div>
                <label className={labelCls}>Size: {size}px</label>
                <input type="range" min={200} max={600} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelCls}>Margin: {margin}</label>
                <input type="range" min={0} max={10} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className={labelCls}>Error correction</label>
                <select value={ecLevel} onChange={(e) => setEcLevel(e.target.value as ECLevel)} className={inputCls}>
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30% — for logos)</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#E8970A] mb-2">
                <Type size={18} />
                <h3 className="font-semibold">Caption</h3>
              </div>
              <div>
                <label className={labelCls}>Caption text</label>
                <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Font size: {captionSize}px</label>
                  <input type="range" min={10} max={36} value={captionSize} onChange={(e) => setCaptionSize(Number(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className={labelCls}>Color</label>
                  <input type="color" value={captionColor} onChange={(e) => setCaptionColor(e.target.value)} className="h-10 w-full rounded border border-[#1A1726] bg-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl bg-[#0F0D1A] border border-[#1A1726] p-6">
              <h3 className="font-semibold text-[#E8970A] mb-4">Preview</h3>
              <div className="flex flex-col items-center p-8 rounded-lg" style={{ backgroundColor: bgColor }}>
                <canvas ref={canvasRef} className="rounded-lg" />
                {caption && (
                  <p
                    className="mt-4 font-bold text-center"
                    style={{ fontSize: `${captionSize}px`, color: captionColor }}
                  >
                    {caption}
                  </p>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={downloadPNG} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E8970A] text-black text-sm font-semibold hover:brightness-110 transition">
                  <Download size={16} /> PNG
                </button>
                <button onClick={downloadSVG} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#1A1726] text-sm hover:border-[#E8970A] transition">
                  <Download size={16} /> SVG
                </button>
                <button onClick={downloadPrintReady} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#1A1726] text-sm hover:border-[#E8970A] transition">
                  <Printer size={16} /> Print PDF
                </button>
                <button onClick={copyDataUrl} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#1A1726] text-sm hover:border-[#E8970A] transition">
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Data URL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
