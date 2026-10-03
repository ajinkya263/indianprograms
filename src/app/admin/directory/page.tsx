'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarRating from '@/components/StarRating'
import { createClient } from '@/lib/supabase/client'
import { Check, X, MapPin, Phone, Globe, ExternalLink, ChevronLeft, ChevronRight, Filter, CheckSquare, Square, Trash2 } from 'lucide-react'

type Tab = 'listings' | 'reviews'
const PAGE_SIZE = 50

interface PendingListing {
  id: string
  name: string
  description: string
  phone: string
  email: string
  website: string
  address_line1: string
  city: string
  state: string
  zip_code: string
  category_key: string
  image_url: string
  price_range: string
  cuisine_types: string[]
  specialties: string[]
  avg_rating: number
  review_count: number
  source: string
  submitted_by_name: string
  submitted_by_email: string
  created_at: string
  status: string
}

interface PendingReview {
  id: string
  listing_id: string
  reviewer_name: string
  rating: number
  title: string
  comment: string
  created_at: string
  status: string
  listing_name?: string
}

export default function AdminDirectoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('listings')
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [totalListings, setTotalListings] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [editingListing, setEditingListing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PendingListing>>({})

  // Filters & pagination
  const [page, setPage] = useState(0)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Available filter values
  const [categories, setCategories] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      // Load filter options
      await loadFilterOptions()
      await fetchData()
    }
    init()
  }, [])

  // Re-fetch when filters or page change
  useEffect(() => {
    fetchData()
    setSelectedIds(new Set())
  }, [page, filterCategory, filterSource, filterCity, tab])

  const loadFilterOptions = async () => {
    // Get distinct categories and cities from pending listings
    const { data: catData } = await supabase
      .from('directory_listings')
      .select('category_key')
      .eq('status', 'pending')
    if (catData) {
      const cats = Array.from(new Set(catData.map(r => r.category_key))).sort()
      setCategories(cats)
    }

    const { data: cityData } = await supabase
      .from('directory_listings')
      .select('city')
      .eq('status', 'pending')
    if (cityData) {
      const cityList = Array.from(new Set(cityData.map(r => r.city))).filter(Boolean).sort()
      setCities(cityList)
    }
  }

  const fetchData = async () => {
    setLoading(true)

    if (tab === 'listings') {
      let query = supabase
        .from('directory_listings')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (filterCategory) query = query.eq('category_key', filterCategory)
      if (filterSource) query = query.eq('source', filterSource)
      if (filterCity) query = query.ilike('city', `%${filterCity}%`)

      const { data: listings, count } = await query
      if (listings) setPendingListings(listings)
      setTotalListings(count || 0)
    } else {
      const { data: reviews, count } = await supabase
        .from('directory_reviews')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (reviews && reviews.length > 0) {
        const listingIds = Array.from(new Set(reviews.map((r: any) => r.listing_id)))
        const { data: listingNames } = await supabase
          .from('directory_listings')
          .select('id, name')
          .in('id', listingIds)

        const nameMap: Record<string, string> = {}
        listingNames?.forEach((l) => { nameMap[l.id] = l.name })
        setPendingReviews(reviews.map((r) => ({ ...r, listing_name: nameMap[r.listing_id] || 'Unknown' })))
      } else {
        setPendingReviews([])
      }
      setTotalReviews(count || 0)
    }

    setLoading(false)
  }

  // ── Single actions ──

  const adminApi = async (body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }))
      return { ok: false, error: err.error }
    }
    return { ok: true }
  }

  const handleApproveListing = async (id: string) => {
    await adminApi({ action: 'directory-set-status', id, table: 'directory_listings', status: 'published' })
    setPendingListings(prev => prev.filter(l => l.id !== id))
    setTotalListings(prev => prev - 1)
    setEditingListing(null)
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const handleRejectListing = async (id: string) => {
    await adminApi({ action: 'directory-set-status', id, table: 'directory_listings', status: 'rejected' })
    setPendingListings(prev => prev.filter(l => l.id !== id))
    setTotalListings(prev => prev - 1)
    setEditingListing(null)
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const handleApproveReview = async (id: string) => {
    await adminApi({ action: 'directory-set-status', id, table: 'directory_reviews', status: 'published' })
    setPendingReviews(prev => prev.filter(r => r.id !== id))
    setTotalReviews(prev => prev - 1)
  }

  const handleRejectReview = async (id: string) => {
    await adminApi({ action: 'directory-set-status', id, table: 'directory_reviews', status: 'rejected' })
    setPendingReviews(prev => prev.filter(r => r.id !== id))
    setTotalReviews(prev => prev - 1)
  }

  // ── Bulk actions ──

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingListings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingListings.map(l => l.id)))
    }
  }

  const bulkApprove = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selectedIds)
    await adminApi({ action: 'directory-set-status', ids, table: 'directory_listings', status: 'published' })
    setPendingListings(prev => prev.filter(l => !selectedIds.has(l.id)))
    setTotalListings(prev => prev - ids.length)
    setSelectedIds(new Set())
    setBulkLoading(false)
  }

  const bulkReject = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selectedIds)
    await adminApi({ action: 'directory-set-status', ids, table: 'directory_listings', status: 'rejected' })
    setPendingListings(prev => prev.filter(l => !selectedIds.has(l.id)))
    setTotalListings(prev => prev - ids.length)
    setSelectedIds(new Set())
    setBulkLoading(false)
  }

  const bulkApproveAll = async () => {
    if (!confirm(`Approve ALL ${totalListings} pending listings${filterCategory ? ` in "${filterCategory}"` : ''}${filterCity ? ` in "${filterCity}"` : ''}? This cannot be undone.`)) return
    setBulkLoading(true)
    // Fetch matching IDs first, then update via server API
    let query = supabase.from('directory_listings').select('id').eq('status', 'pending')
    if (filterCategory) query = query.eq('category_key', filterCategory)
    if (filterSource) query = query.eq('source', filterSource)
    if (filterCity) query = query.ilike('city', `%${filterCity}%`)
    const { data: rows } = await query
    if (rows?.length) {
      await adminApi({ action: 'directory-set-status', ids: rows.map((r: any) => r.id), table: 'directory_listings', status: 'published' })
    }
    setSelectedIds(new Set())
    setBulkLoading(false)
    await fetchData()
    await loadFilterOptions()
  }

  const startEditing = (listing: PendingListing) => {
    setEditingListing(listing.id)
    setEditForm({
      name: listing.name,
      description: listing.description,
      phone: listing.phone,
      email: listing.email,
      website: listing.website,
      city: listing.city,
      state: listing.state,
    })
  }

  const totalPages = Math.ceil((tab === 'listings' ? totalListings : totalReviews) / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-[#070510]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1
          className="text-3xl font-bold text-white mb-6"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Directory Management
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#0F0D1A] border border-[#1A1726] w-fit">
          <button
            onClick={() => { setTab('listings'); setPage(0) }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'listings' ? 'bg-[#E8970A] text-black' : 'text-gray-400 hover:text-white'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Pending Listings ({totalListings})
          </button>
          <button
            onClick={() => { setTab('reviews'); setPage(0) }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'reviews' ? 'bg-[#E8970A] text-black' : 'text-gray-400 hover:text-white'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Pending Reviews ({totalReviews})
          </button>
        </div>

        {/* Filters & Bulk Actions (listings only) */}
        {tab === 'listings' && (
          <div className="mb-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(0) }}
                className="px-3 py-2 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value); setPage(0) }}
                className="px-3 py-2 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <option value="">All Sources</option>
                <option value="crawler">Crawler</option>
                <option value="manual">Manual</option>
                <option value="import">Import</option>
              </select>
              <input
                type="text"
                value={filterCity}
                onChange={(e) => { setFilterCity(e.target.value); setPage(0) }}
                placeholder="Filter by city..."
                className="px-3 py-2 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A]/50 w-48"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 border border-[#1A1726] hover:text-white hover:border-gray-500 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {selectedIds.size === pendingListings.length && pendingListings.length > 0
                  ? <CheckSquare size={14} />
                  : <Square size={14} />
                }
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
              </button>
              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={bulkApprove}
                    disabled={bulkLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    <Check size={14} /> Approve {selectedIds.size}
                  </button>
                  <button
                    onClick={bulkReject}
                    disabled={bulkLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    <X size={14} /> Reject {selectedIds.size}
                  </button>
                </>
              )}
              <div className="flex-1" />
              <button
                onClick={bulkApproveAll}
                disabled={bulkLoading || totalListings === 0}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <Check size={14} /> Approve All{filterCategory || filterCity ? ' (filtered)' : ''} ({totalListings})
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-[#0F0D1A] animate-pulse" />
            ))}
          </div>
        ) : tab === 'listings' ? (
          pendingListings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                No pending listings{filterCategory || filterCity ? ' matching filters' : ''}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingListings.map((listing) => (
                <div
                  key={listing.id}
                  className={`p-5 rounded-xl bg-[#0F0D1A] border transition-colors ${
                    selectedIds.has(listing.id) ? 'border-[#E8970A]/50' : 'border-[#1A1726]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(listing.id)}
                      className="mt-1 text-gray-500 hover:text-white transition-colors"
                    >
                      {selectedIds.has(listing.id)
                        ? <CheckSquare size={18} className="text-[#E8970A]" />
                        : <Square size={18} />
                      }
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {editingListing === listing.id ? (
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white font-semibold focus:outline-none focus:border-[#E8970A]/50 mb-1"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            />
                          ) : (
                            <h3 className="text-white font-semibold truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                              {listing.name}
                            </h3>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#1A1726]">{listing.category_key}</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {listing.city}, {listing.state}
                            </span>
                            {listing.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} /> {listing.phone}
                              </span>
                            )}
                            {listing.avg_rating > 0 && (
                              <span className="text-[#E8970A]">★ {listing.avg_rating} ({listing.review_count})</span>
                            )}
                            {listing.source === 'crawler' && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">crawler</span>
                            )}
                            {listing.website && (
                              <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#E8970A] hover:underline">
                                <Globe size={11} /> <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {editingListing !== listing.id && (
                            <button
                              onClick={() => startEditing(listing)}
                              className="px-2.5 py-1 rounded-lg text-xs text-gray-400 border border-[#1A1726] hover:text-white hover:border-gray-500 transition-colors"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleApproveListing(listing.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            <Check size={13} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectListing(listing.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            <X size={13} /> Reject
                          </button>
                        </div>
                      </div>

                      {/* Editable fields */}
                      {editingListing === listing.id && (
                        <div className="space-y-2 mt-3">
                          <textarea
                            rows={2}
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50 resize-none"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                            placeholder="Description"
                          />
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(['phone', 'email', 'website', 'city'] as const).map(field => (
                              <input
                                key={field}
                                type="text"
                                value={(editForm as any)[field] || ''}
                                onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                className="px-3 py-1.5 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                                style={{ fontFamily: 'DM Sans, sans-serif' }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {editingListing !== listing.id && listing.description && (
                        <p className="text-gray-500 text-xs mt-1.5 line-clamp-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {listing.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Reviews tab */
          pendingReviews.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                No pending reviews to moderate.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <div key={review.id} className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-medium text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {review.reviewer_name}
                        </span>
                        <span className="text-gray-500 text-xs">→</span>
                        <span className="text-[#E8970A] text-sm font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {review.listing_name}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={14} />
                      {review.title && (
                        <h4 className="text-white font-semibold text-sm mt-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {review.title}
                        </h4>
                      )}
                      {review.comment && (
                        <p className="text-gray-300 text-sm mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {review.comment}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveReview(review.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectReview(review.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1A1726]">
            <p className="text-gray-400 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Page {page + 1} of {totalPages} ({tab === 'listings' ? totalListings : totalReviews} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:text-white hover:border-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 border border-[#1A1726] hover:text-white hover:border-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
