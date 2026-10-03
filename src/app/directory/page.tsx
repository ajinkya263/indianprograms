'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarRating from '@/components/StarRating'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, ArrowRight } from 'lucide-react'

interface Category {
  id: string
  key: string
  label: string
  description: string
  emoji: string
  sort_order: number
  listing_count?: number
}

interface Listing {
  id: string
  name: string
  description: string
  city: string
  state: string
  avg_rating: number
  review_count: number
  image_url: string
  price_range: string
  category_key: string
}

export default function DirectoryPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Listing[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userCity, setUserCity] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    detectLocation()
  }, [])

  const fetchData = async () => {
    // Fetch categories
    const { data: cats } = await supabase
      .from('directory_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (cats) {
      // Fetch listing counts per category
      const { data: listings } = await supabase
        .from('directory_listings')
        .select('category_key')
        .eq('status', 'published')

      const countMap: Record<string, number> = {}
      listings?.forEach((l) => {
        countMap[l.category_key] = (countMap[l.category_key] || 0) + 1
      })

      setCategories(cats.map((c) => ({ ...c, listing_count: countMap[c.key] || 0 })))
    }

    // Fetch featured/top-rated listings
    const { data: featured } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'published')
      .order('avg_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(6)

    if (featured) setFeaturedListings(featured)

    setLoading(false)
  }

  const detectLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
            )
            const data = await res.json()
            const city = data.city || data.locality || null
            if (city) {
              setUserCity(city)
              const { data: nearby } = await supabase
                .from('directory_listings')
                .select('*')
                .eq('status', 'published')
                .ilike('city', `%${city}%`)
                .limit(6)
              if (nearby) setNearbyListings(nearby)
            }
          } catch {
            // Ignore geolocation errors
          }
        },
        () => {
          // Permission denied or error
        }
      )
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const q = searchQuery.trim()
    const { data } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'published')
      .or(`name.ilike.%${q}%,city.ilike.%${q}%,category_key.ilike.%${q}%`)
      .limit(12)
    setSearchResults(data || [])
    setSearching(false)
  }

  const categoryColors = [
    'from-orange-500/20 to-orange-600/5',
    'from-green-500/20 to-green-600/5',
    'from-amber-500/20 to-amber-600/5',
    'from-pink-500/20 to-pink-600/5',
    'from-cyan-500/20 to-cyan-600/5',
    'from-violet-500/20 to-violet-600/5',
    'from-blue-500/20 to-blue-600/5',
    'from-red-500/20 to-red-600/5',
    'from-teal-500/20 to-teal-600/5',
  ]

  return (
    <div className="min-h-screen bg-[#070510]">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8970A]/5 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Indian Business{' '}
            <span className="text-[#E8970A]">Directory</span>
          </h1>
          <p
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Find Indian businesses, services, and professionals near you.
            Restaurants, temples, grocery stores, and more across 35+ US cities.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search by name, city, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0F0D1A] border border-[#1A1726] text-white placeholder-gray-500 focus:outline-none focus:border-[#E8970A]/50 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3.5 rounded-xl font-medium text-black transition-colors hover:opacity-90"
              style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Search results */}
      {(searchResults.length > 0 || searching) && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <h2
            className="text-2xl font-bold text-white mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Search Results
          </h2>
          {searching ? (
            <p className="text-gray-400">Searching...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Category grid */}
      {!searching && searchResults.length === 0 && (
        <>
          <section className="max-w-7xl mx-auto px-4 pb-16">
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-8 text-center"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Browse by Category
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-xl bg-[#0F0D1A] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat, i) => (
                  <Link
                    key={cat.id}
                    href={`/directory/${cat.key}`}
                    className="group relative p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 transition-all hover:scale-[1.02]"
                  >
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${categoryColors[i % categoryColors.length]} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative z-10">
                      <span className="text-3xl mb-3 block">{cat.emoji}</span>
                      <h3
                        className="text-white font-semibold text-sm mb-1"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {cat.label}
                      </h3>
                      <p className="text-gray-500 text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {cat.listing_count} {cat.listing_count === 1 ? 'listing' : 'listings'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Near You section */}
          {nearbyListings.length > 0 && userCity && (
            <section className="max-w-7xl mx-auto px-4 pb-16">
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={20} className="text-[#E8970A]" />
                <h2
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Near You in {userCity}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Featured / Top-rated */}
          {featuredListings.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 pb-16">
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-8 text-center"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Top-Rated Businesses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#E8970A]/10 to-[#0F0D1A] border border-[#E8970A]/20">
              <h2
                className="text-2xl font-bold text-white mb-3"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Own an Indian Business?
              </h2>
              <p className="text-gray-400 mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Get discovered by thousands of Indians across America. List your business for free.
              </p>
              <Link
                href="/directory/submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-black transition-colors hover:opacity-90"
                style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
              >
                List Your Business
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  )
}

function ListingCard({ listing }: { listing: { id: string; name: string; city: string; state: string; avg_rating: number; review_count: number; image_url: string; price_range: string; category_key: string } }) {
  return (
    <Link
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
            🏪
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
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <MapPin size={14} />
          <span style={{ fontFamily: 'DM Sans, sans-serif' }}>
            {listing.city}, {listing.state}
          </span>
        </div>
      </div>
    </Link>
  )
}
