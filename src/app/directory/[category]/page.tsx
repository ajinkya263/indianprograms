'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarRating from '@/components/StarRating'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Phone, ChevronRight, ArrowUpDown } from 'lucide-react'

interface Category {
  id: string
  key: string
  label: string
  description: string
  emoji: string
}

interface Listing {
  id: string
  name: string
  description: string
  city: string
  state: string
  phone: string
  avg_rating: number
  review_count: number
  image_url: string
  price_range: string
  category_key: string
  cuisine_types: string[]
  specialties: string[]
  created_at: string
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

type SortOption = 'rating' | 'name' | 'newest'

export default function CategoryPage() {
  const params = useParams()
  const categoryKey = params.category as string
  const supabase = createClient()

  const [category, setCategory] = useState<Category | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [cities, setCities] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 12

  useEffect(() => {
    fetchCategory()
  }, [categoryKey])

  useEffect(() => {
    setPage(0)
    setListings([])
    setHasMore(true)
    fetchListings(0)
  }, [categoryKey, cityFilter, stateFilter, sortBy])

  const fetchCategory = async () => {
    const { data } = await supabase
      .from('directory_categories')
      .select('*')
      .eq('key', categoryKey)
      .single()
    if (data) setCategory(data)
  }

  const fetchListings = async (pageNum: number) => {
    setLoading(true)
    let query = supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'published')
      .eq('category_key', categoryKey)

    if (cityFilter) query = query.ilike('city', `%${cityFilter}%`)
    if (stateFilter) query = query.eq('state', stateFilter)

    if (sortBy === 'rating') {
      query = query.order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
    } else if (sortBy === 'name') {
      query = query.order('name', { ascending: true })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    const { data } = await query
    if (data) {
      if (pageNum === 0) {
        setListings(data)
        // Collect distinct cities
        const allCities = Array.from(new Set(data.map((l: any) => l.city))).sort() as string[]
        setCities(allCities)
      } else {
        setListings((prev) => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchListings(nextPage)
  }

  return (
    <div className="min-h-screen bg-[#070510]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          <Link href="/directory" className="hover:text-white transition-colors">
            Directory
          </Link>
          <ChevronRight size={14} />
          <span className="text-white">{category?.label || categoryKey}</span>
        </nav>

        {/* Category header */}
        {category && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{category.emoji}</span>
              <h1
                className="text-3xl md:text-4xl font-bold text-white"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {category.label}
              </h1>
            </div>
            <p className="text-gray-400 ml-14" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {category.description}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>City</label>
            <input
              type="text"
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <option value="">All States</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Listings grid */}
        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-[#0F0D1A] animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              No listings found in this category yet.
            </p>
            <Link
              href="/directory/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-black"
              style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Submit a Business
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/directory/listing/${listing.id}`}
                  className="group rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 overflow-hidden transition-all hover:scale-[1.01]"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] bg-[#1A1726] relative overflow-hidden">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                        {category?.emoji || '🏪'}
                      </div>
                    )}
                    {listing.price_range && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 text-[#E8970A] text-xs font-medium backdrop-blur-sm">
                        {listing.price_range}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="text-white font-semibold mb-1 group-hover:text-[#E8970A] transition-colors"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    >
                      {listing.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={listing.avg_rating} size={14} />
                      <span className="text-gray-500 text-xs">({listing.review_count})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                      <MapPin size={14} />
                      <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {listing.city}, {listing.state}
                      </span>
                    </div>
                    {listing.phone && (
                      <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                        <Phone size={14} />
                        <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.phone}</span>
                      </div>
                    )}
                    {/* Badges */}
                    {listing.cuisine_types && listing.cuisine_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {listing.cuisine_types.slice(0, 3).map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-[#1A1726] text-gray-400 text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-medium text-white border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'DM Sans, sans-serif' }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Submit link */}
        <div className="text-center mt-12 mb-8">
          <Link
            href="/directory/submit"
            className="text-[#E8970A] hover:text-[#E8970A]/80 text-sm font-medium transition-colors"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Know a business that should be listed? Submit it here →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
