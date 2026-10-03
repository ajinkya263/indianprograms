'use client'

import { useRef, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react'

interface MultiImageUploadProps {
  userId: string
  initialImages?: string[]
  maxImages?: number
  onChange: (urls: string[]) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export default function MultiImageUpload({
  userId,
  initialImages = [],
  maxImages = 10,
  onChange,
}: MultiImageUploadProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    onChange(images)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  const uploadFiles = async (files: FileList | File[]) => {
    setError('')
    const list = Array.from(files)
    const remaining = maxImages - images.length
    if (remaining <= 0) {
      setError(`Max ${maxImages} images allowed.`)
      return
    }
    const toUpload = list.slice(0, remaining)
    const valid: File[] = []
    for (const f of toUpload) {
      if (!ACCEPTED.includes(f.type)) {
        setError('Only JPG, PNG, WebP allowed.')
        continue
      }
      if (f.size > MAX_SIZE) {
        setError(`${f.name} exceeds 10MB.`)
        continue
      }
      valid.push(f)
    }
    if (valid.length === 0) return

    setUploading(true)
    setProgress(0)
    const uploaded: string[] = []
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i]
      const filePath = `social/${userId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error: upErr } = await supabase.storage
        .from('post-images')
        .upload(filePath, file)
      if (upErr) {
        setError('Upload failed: ' + upErr.message)
        continue
      }
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)
      uploaded.push(urlData.publicUrl)
      setProgress(Math.round(((i + 1) / valid.length) * 100))
    }
    setImages((prev) => [...prev, ...uploaded])
    setUploading(false)
    setProgress(0)
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const onDragStartThumb = (idx: number) => setDragIndex(idx)
  const onDropThumb = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return
    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIndex(null)
  }

  const canAddMore = images.length < maxImages

  return (
    <div>
      {canAddMore && (
        <div
          className={`relative bg-[#0F0D1A] border border-dashed rounded-lg transition-colors cursor-pointer ${
            dragOver ? 'border-[#E8970A]' : 'border-[#1A1726] hover:border-[#E8970A]/50'
          }`}
          style={{ minHeight: '140px' }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(false)
            if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files)
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-500">
            <Upload size={28} className="text-gray-600" />
            <p className="text-sm">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-600">
              JPG, PNG, WebP. Max 10MB each. Up to {maxImages} images. ({images.length}/{maxImages})
            </p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-2">
          <div className="h-1.5 bg-[#1A1726] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8970A] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={() => onDragStartThumb(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropThumb(i)}
              className="relative group aspect-square rounded-lg overflow-hidden border border-[#1A1726] hover:border-[#E8970A]/60 bg-[#0F0D1A]"
            >
              <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(i)
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8970A] text-black">
                  Main
                </div>
              )}
            </div>
          ))}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border border-dashed border-[#1A1726] hover:border-[#E8970A]/60 bg-[#0F0D1A] flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#E8970A] transition-colors"
            >
              <Plus size={18} />
              <span className="text-[10px]">Add</span>
            </button>
          )}
        </div>
      )}

      {images.length === 0 && !canAddMore && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <ImageIcon size={12} />
          No images yet
        </div>
      )}
    </div>
  )
}
