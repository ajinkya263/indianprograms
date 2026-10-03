'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Upload, CheckCircle } from 'lucide-react'

interface Category {
  id: string
  key: string
  label: string
  emoji: string
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'DC', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
  'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
]

const CUISINE_OPTIONS = [
  'North Indian', 'South Indian', 'Indo-Chinese', 'Mughlai', 'Punjabi',
  'Gujarati', 'Bengali', 'Rajasthani', 'Kerala', 'Hyderabadi',
  'Chettinad', 'Street Food', 'Biryani', 'Dosa', 'Chaat', 'Vegan', 'Vegetarian',
]

const CLASS_TYPE_OPTIONS = ['Dance', 'Vocal Music', 'Instrumental Music', 'Painting', 'Language', 'Yoga', 'Cooking']

const RELIGION_OPTIONS = ['Hindu', 'Sikh', 'Jain', 'Buddhist', 'Muslim', 'Christian', 'Multi-faith']

const GROCERY_OPTIONS = ['Fresh Produce', 'Spices', 'Frozen Foods', 'Sweets & Snacks', 'Ready-to-eat', 'Paan & Betel', 'Pickles']

const PRICE_OPTIONS = ['$', '$$', '$$$', '$$$$']

interface FormData {
  category_id: string
  category_key: string
  name: string
  description: string
  phone: string
  email: string
  website: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip_code: string
  submitted_by_name: string
  submitted_by_email: string
  price_range: string
  cuisine_types: string[]
  specialties: string[]
}

export default function SubmitListingPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  const [form, setForm] = useState<FormData>({
    category_id: '',
    category_key: '',
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    submitted_by_name: '',
    submitted_by_email: '',
    price_range: '',
    cuisine_types: [],
    specialties: [],
  })

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('directory_categories')
        .select('id, key, label, emoji')
        .eq('is_active', true)
        .order('sort_order')
      if (data && data.length > 0) {
        setCategories(data)
        setForm((f) => ({ ...f, category_id: data[0].id, category_key: data[0].key }))
      }
      setLoading(false)
    }
    fetchCategories()
  }, [])

  const selectedCategory = categories.find((c) => c.id === form.category_id)

  const handleCategoryChange = (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (cat) {
      setForm({ ...form, category_id: id, category_key: cat.key, cuisine_types: [], specialties: [], price_range: '' })
    }
  }

  const toggleArrayItem = (field: 'cuisine_types' | 'specialties', value: string) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    let image_url = ''

    // Upload image if provided
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `directory/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, imageFile, { contentType: imageFile.type })

      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(path)
        image_url = publicUrl.publicUrl
      }
    }

    const { error } = await supabase.from('directory_listings').insert({
      category_id: form.category_id,
      category_key: form.category_key,
      name: form.name,
      description: form.description,
      phone: form.phone,
      email: form.email,
      website: form.website,
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      submitted_by_name: form.submitted_by_name,
      submitted_by_email: form.submitted_by_email,
      price_range: form.price_range || '',
      cuisine_types: form.cuisine_types,
      specialties: form.specialties,
      image_url,
      status: 'pending',
    })

    if (!error) {
      setSubmitted(true)
    } else {
      alert('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070510]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#070510]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h1
            className="text-3xl font-bold text-white mb-3"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Thank You!
          </h1>
          <p className="text-gray-400 mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Your listing will be reviewed and published shortly. We appreciate your contribution to the Indian community.
          </p>
          <Link
            href="/directory"
            className="inline-block px-6 py-3 rounded-xl font-medium text-black"
            style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
          >
            Back to Directory
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070510]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          List Your Business
        </h1>
        <p className="text-gray-400 mb-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Help the Indian community discover your business. No login required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Category *
            </label>
            <select
              value={form.category_id}
              onChange={(e) => handleCategoryChange(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Business Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Taj Mahal Restaurant"
              className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell us about this business..."
              className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50 resize-none"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@business.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>Address</h3>
            <input
              type="text"
              value={form.address_line1}
              onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
              placeholder="Address Line 1"
              className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
            <input
              type="text"
              value={form.address_line2}
              onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
              placeholder="Address Line 2 (optional)"
              className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City *"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              <div>
                <select
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  <option value="">State *</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  value={form.zip_code}
                  onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic category fields */}
          {selectedCategory?.key === 'restaurants' && (
            <div className="space-y-4 p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
              <h3 className="text-white font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Restaurant Details
              </h3>
              <div>
                <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Cuisine Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArrayItem('cuisine_types', c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        form.cuisine_types.includes(c)
                          ? 'bg-[#E8970A] text-black'
                          : 'bg-[#1A1726] text-gray-400 hover:text-white'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Price Range
                </label>
                <div className="flex gap-2">
                  {PRICE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, price_range: form.price_range === p ? '' : p })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        form.price_range === p
                          ? 'bg-[#E8970A] text-black'
                          : 'bg-[#1A1726] text-gray-400 hover:text-white'
                      }`}
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedCategory?.key === 'cultural_classes' && (
            <div className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
              <h3 className="text-white font-semibold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Class Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {CLASS_TYPE_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleArrayItem('specialties', c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      form.specialties.includes(c)
                        ? 'bg-[#E8970A] text-black'
                        : 'bg-[#1A1726] text-gray-400 hover:text-white'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory?.key === 'temples' && (
            <div className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
              <h3 className="text-white font-semibold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Religion
              </h3>
              <div className="flex flex-wrap gap-2">
                {RELIGION_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleArrayItem('specialties', r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      form.specialties.includes(r)
                        ? 'bg-[#E8970A] text-black'
                        : 'bg-[#1A1726] text-gray-400 hover:text-white'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedCategory?.key === 'grocery' && (
            <div className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
              <h3 className="text-white font-semibold mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Specialties
              </h3>
              <div className="flex flex-wrap gap-2">
                {GROCERY_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleArrayItem('specialties', g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      form.specialties.includes(g)
                        ? 'bg-[#E8970A] text-black'
                        : 'bg-[#1A1726] text-gray-400 hover:text-white'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Business Image (optional)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl bg-[#0F0D1A] border-2 border-dashed border-[#1A1726] hover:border-[#E8970A]/30 cursor-pointer transition-colors overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Upload size={24} className="text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    Click to upload an image
                  </p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Submitter info */}
          <div className="space-y-4 p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
            <h3 className="text-white font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Your Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Your Name *</label>
                <input
                  type="text"
                  required
                  value={form.submitted_by_name}
                  onChange={(e) => setForm({ ...form, submitted_by_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Your Email</label>
                <input
                  type="email"
                  value={form.submitted_by_email}
                  onChange={(e) => setForm({ ...form, submitted_by_email: e.target.value })}
                  placeholder="For notifications"
                  className="w-full px-4 py-3 rounded-xl bg-[#1A1726] border border-[#2A2736] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-medium text-black text-lg transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
          >
            {submitting ? 'Submitting...' : 'Submit Listing'}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  )
}
