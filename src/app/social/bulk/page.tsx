'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Check, X, AlertCircle, Download, ArrowRight } from 'lucide-react'

interface ParsedRow {
  rowNum: number
  content: string
  scheduled_for: string
  platforms: string[]
  image_url: string
  hashtags: string
  link_url: string
  errors: string[]
  valid: boolean
}

const SAMPLE_CSV = `content,scheduled_for,platforms,image_url,hashtags,link_url
"Diwali Night Houston! Join us for an evening of music, dance, and celebration",2026-11-08 18:00,"facebook,instagram",,"#diwali #houston","https://tickets.example.com/diwali"
"Carnatic Concert this Saturday at Bay Area Indian Cultural Center",2026-04-15 19:30,"twitter,facebook",,"#carnatic #bayarea",
"Holi Festival of Colors - Free entry, food, music",2026-03-04 11:00,"instagram,facebook",https://example.com/holi.jpg,"#holi #freeevent",https://eventbrite.com/holi`

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  for (const line of lines) {
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cells.push(current.trim())
    rows.push(cells)
  }
  return rows
}

const VALID_PLATFORMS = ['facebook', 'instagram', 'twitter', 'threads', 'linkedin', 'tiktok', 'youtube']

function validateRow(row: ParsedRow): string[] {
  const errors: string[] = []
  if (!row.content || row.content.length < 5) errors.push('Content too short')
  if (!row.scheduled_for) errors.push('Missing scheduled_for')
  else {
    const d = new Date(row.scheduled_for)
    if (isNaN(d.getTime())) errors.push('Invalid date format')
    else if (d < new Date()) errors.push('Date is in the past')
  }
  if (row.platforms.length === 0) errors.push('No platforms')
  else {
    const invalid = row.platforms.filter(p => !VALID_PLATFORMS.includes(p))
    if (invalid.length) errors.push(`Invalid platforms: ${invalid.join(', ')}`)
  }
  if (row.image_url && !row.image_url.startsWith('http')) errors.push('Invalid image URL')
  if (row.link_url && !row.link_url.startsWith('http')) errors.push('Invalid link URL')
  return errors
}

export default function BulkUploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [skipInvalid, setSkipInvalid] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setUserId(user.id)
    })
  }, [])

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-posts-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseCSV(text)
    if (parsed.length < 2) {
      alert('CSV must have a header row and at least one data row')
      return
    }
    const header = parsed[0].map(h => h.toLowerCase())
    const idxContent = header.indexOf('content')
    const idxDate = header.indexOf('scheduled_for')
    const idxPlatforms = header.indexOf('platforms')
    const idxImage = header.indexOf('image_url')
    const idxHashtags = header.indexOf('hashtags')
    const idxLink = header.indexOf('link_url')

    if (idxContent === -1 || idxDate === -1 || idxPlatforms === -1) {
      alert('Required columns: content, scheduled_for, platforms')
      return
    }

    const dataRows: ParsedRow[] = parsed.slice(1).map((cells, i) => {
      const row: ParsedRow = {
        rowNum: i + 2,
        content: cells[idxContent] || '',
        scheduled_for: cells[idxDate] || '',
        platforms: (cells[idxPlatforms] || '').split(',').map(p => p.trim().toLowerCase()).filter(Boolean),
        image_url: idxImage >= 0 ? cells[idxImage] || '' : '',
        hashtags: idxHashtags >= 0 ? cells[idxHashtags] || '' : '',
        link_url: idxLink >= 0 ? cells[idxLink] || '' : '',
        errors: [],
        valid: false,
      }
      row.errors = validateRow(row)
      row.valid = row.errors.length === 0
      return row
    })

    setRows(dataRows)
    setStep(2)
  }

  const handleSchedule = async () => {
    if (!userId) return
    setSubmitting(true)
    setProgress(0)

    const toInsert = skipInvalid ? rows.filter(r => r.valid) : rows
    let inserted = 0

    for (const row of toInsert) {
      if (!row.valid && !skipInvalid) continue

      const scheduledDate = new Date(row.scheduled_for)
      await supabase.from('scheduled_posts').insert({
        user_id: userId,
        content: row.content,
        image_url: row.image_url,
        image_urls: row.image_url ? [row.image_url] : [],
        link_url: row.link_url,
        hashtags: row.hashtags,
        platforms: row.platforms,
        schedule_type: 'once',
        scheduled_for: scheduledDate.toISOString(),
        next_run_at: scheduledDate.toISOString(),
        status: 'scheduled',
      })

      inserted++
      setProgress(inserted)
    }

    setSubmitting(false)
    router.push('/social/queue')
  }

  const validCount = rows.filter(r => r.valid).length
  const invalidCount = rows.length - validCount

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#E8970A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Bulk Upload Posts
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Upload many scheduled posts at once via CSV</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Upload CSV' },
            { n: 2, label: 'Preview' },
            { n: 3, label: 'Schedule' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s.n ? 'bg-[#E8970A] text-black' : 'bg-[#1A1726] text-gray-500'
              }`}>{s.n}</div>
              <span className={`text-sm ${step >= s.n ? 'text-white' : 'text-gray-500'}`}>{s.label}</span>
              {i < 2 && <ArrowRight size={14} className="text-gray-600 mx-2" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-8">
              <label className="block">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
                <div className="border-2 border-dashed border-[#1A1726] hover:border-[#E8970A]/50 rounded-xl p-12 text-center cursor-pointer transition-colors">
                  <Upload size={40} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-white font-medium mb-1">Click to upload CSV</p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
              </label>
            </div>

            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-2">CSV Format</h3>
              <p className="text-xs text-gray-400 mb-3">Required columns: <code className="text-[#E8970A]">content</code>, <code className="text-[#E8970A]">scheduled_for</code>, <code className="text-[#E8970A]">platforms</code></p>
              <p className="text-xs text-gray-400 mb-3">Optional: <code className="text-gray-300">image_url</code>, <code className="text-gray-300">hashtags</code>, <code className="text-gray-300">link_url</code></p>
              <button
                onClick={downloadSample}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-[#E8970A]/15 text-[#E8970A] border border-[#E8970A]/30 hover:bg-[#E8970A]/25"
              >
                <Download size={12} />
                Download Sample CSV
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-4">
              <div className="text-sm">
                <span className="text-green-400 font-medium">{validCount}</span>
                <span className="text-gray-400"> valid, </span>
                <span className="text-red-400 font-medium">{invalidCount}</span>
                <span className="text-gray-400"> invalid of {rows.length} total</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input type="checkbox" checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} className="accent-[#E8970A]" />
                Skip invalid rows
              </label>
            </div>

            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#070510] sticky top-0">
                  <tr className="text-gray-500">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Content</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Platforms</th>
                    <th className="px-3 py-2 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNum} className={`border-t border-[#1A1726]/50 ${!row.valid ? 'bg-red-500/5' : ''}`}>
                      <td className="px-3 py-2 text-gray-500">{row.rowNum}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <AlertCircle size={14} className="text-red-400" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate">{row.content}</td>
                      <td className="px-3 py-2 text-gray-400">{row.scheduled_for}</td>
                      <td className="px-3 py-2 text-gray-400">{row.platforms.join(', ')}</td>
                      <td className="px-3 py-2 text-red-400">{row.errors.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setRows([]) }}
                className="px-5 py-2.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={validCount === 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#E8970A] text-black hover:opacity-90 disabled:opacity-50"
              >
                Continue to Schedule ({validCount} valid)
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-8 text-center">
              <FileText size={40} className="mx-auto text-[#E8970A] mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Ready to Schedule</h3>
              <p className="text-gray-400 mb-6">{validCount} posts will be scheduled across selected platforms</p>

              {submitting ? (
                <div className="space-y-3">
                  <div className="text-sm text-[#E8970A]">Scheduling {progress} of {validCount}...</div>
                  <div className="h-2 bg-[#1A1726] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E8970A] transition-all" style={{ width: `${(progress / validCount) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSchedule}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[#E8970A] text-black hover:opacity-90"
                  >
                    Schedule All Posts
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
