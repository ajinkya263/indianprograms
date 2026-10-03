'use client'

import { useState } from 'react'
import Link from 'next/link'
import StarRating from '@/components/StarRating'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, Phone, Mail, Globe, Clock, ChevronRight,
  Flag, Shield, Share2, ExternalLink
} from 'lucide-react'

interface Review {
  id: string
  reviewer_name: string
  rating: number
  title: string
  comment: string
  created_at: string
}

interface Listing {
  id: string
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
  latitude: number | null
  longitude: number | null
  image_url: string
  images: string[]
  logo_url: string
  hours_json: Record<string, string>
  price_range: string
  specialties: string[]
  languages: string[]
  payment_methods: string[]
  cuisine_types: string[]
  avg_rating: number
  review_count: number
  category_key: string
}

interface Category {
  key: string
  label: string
  emoji: string
}

interface RelatedListing {
  id: string
  name: string
  city: string
  state: string
  avg_rating: number
  review_count: number
  image_url: string
  price_range: string
}

interface Props {
  listing: Listing
  category: Category | null
  reviews: Review[]
  related: RelatedListing[]
}

export default function ListingDetailClient({ listing, category, reviews: initialReviews, related }: Props) {
  const supabase = createClient()
  const [reviews, setReviews] = useState(initialReviews)
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    reviewer_email: '',
    rating: 0,
    title: '',
    comment: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedImage, setSelectedImage] = useState(listing.image_url || '')

  const allImages = [listing.image_url, ...(listing.images || [])].filter(Boolean)

  const fullAddress = [listing.address_line1, listing.address_line2, listing.city, listing.state, listing.zip_code]
    .filter(Boolean)
    .join(', ')

  const mapsUrl = listing.latitude && listing.longitude
    ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const totalReviews = reviews.length

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reviewForm.rating === 0) return alert('Please select a rating')
    setSubmitting(true)

    await supabase.from('directory_reviews').insert({
      listing_id: listing.id,
      reviewer_name: reviewForm.reviewer_name,
      reviewer_email: reviewForm.reviewer_email,
      rating: reviewForm.rating,
      title: reviewForm.title,
      comment: reviewForm.comment,
      status: 'pending',
    })

    setSubmitted(true)
    setSubmitting(false)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: listing.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <Link href="/directory" className="hover:text-white transition-colors">Directory</Link>
        <ChevronRight size={14} />
        {category && (
          <>
            <Link href={`/directory/${category.key}`} className="hover:text-white transition-colors">
              {category.label}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-white truncate">{listing.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          {allImages.length > 0 && (
            <div>
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#1A1726] mb-3">
                <img
                  src={selectedImage || allImages[0]}
                  alt={listing.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === img ? 'border-[#E8970A]' : 'border-transparent'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Heading */}
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              {category && (
                <span className="px-3 py-1 rounded-full bg-[#E8970A]/10 text-[#E8970A] text-xs font-medium">
                  {category.emoji} {category.label}
                </span>
              )}
              {listing.price_range && (
                <span className="px-3 py-1 rounded-full bg-[#1A1726] text-gray-300 text-xs font-medium">
                  {listing.price_range}
                </span>
              )}
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold text-white mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {listing.name}
            </h1>
            <div className="flex items-center gap-3">
              <StarRating rating={listing.avg_rating} size={20} />
              <span className="text-gray-400 text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {listing.avg_rating > 0 ? listing.avg_rating.toFixed(1) : 'No ratings'} ({listing.review_count} reviews)
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fullAddress && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors"
              >
                <MapPin size={18} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Address</p>
                  <p className="text-white text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>{fullAddress}</p>
                  <p className="text-[#E8970A] text-xs mt-1">Get Directions →</p>
                </div>
              </a>
            )}
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="flex items-start gap-3 p-4 rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors"
              >
                <Phone size={18} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Phone</p>
                  <p className="text-white text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.phone}</p>
                </div>
              </a>
            )}
            {listing.email && (
              <a
                href={`mailto:${listing.email}`}
                className="flex items-start gap-3 p-4 rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors"
              >
                <Mail size={18} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Email</p>
                  <p className="text-white text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>{listing.email}</p>
                </div>
              </a>
            )}
            {listing.website && (
              <a
                href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors"
              >
                <Globe size={18} className="text-[#E8970A] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Website</p>
                  <p className="text-white text-sm flex items-center gap-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {listing.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={12} />
                  </p>
                </div>
              </a>
            )}
          </div>

          {/* Hours */}
          {listing.hours_json && Object.keys(listing.hours_json).length > 0 && (
            <div className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[#E8970A]" />
                <h2 className="text-white font-semibold" style={{ fontFamily: 'DM Sans, sans-serif' }}>Hours</h2>
              </div>
              <div className="space-y-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>{day}</span>
                    <span className="text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {listing.hours_json[day] || listing.hours_json[day.toLowerCase()] || 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h2
                className="text-xl font-bold text-white mb-3"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                About
              </h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {listing.description}
              </p>
            </div>
          )}

          {/* Specialties / Languages / Payment */}
          <div className="space-y-4">
            {listing.cuisine_types && listing.cuisine_types.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Cuisine</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.cuisine_types.map((c) => (
                    <span key={c} className="px-3 py-1 rounded-full bg-[#E8970A]/10 text-[#E8970A] text-xs">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {listing.specialties && listing.specialties.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.specialties.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full bg-[#1A1726] text-gray-300 text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {listing.languages && listing.languages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.languages.map((l) => (
                    <span key={l} className="px-3 py-1 rounded-full bg-[#1A1726] text-gray-300 text-xs">{l}</span>
                  ))}
                </div>
              </div>
            )}
            {listing.payment_methods && listing.payment_methods.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Payment Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.payment_methods.map((p) => (
                    <span key={p} className="px-3 py-1 rounded-full bg-[#1A1726] text-gray-300 text-xs">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2
              className="text-xl font-bold text-white mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Reviews
            </h2>

            {/* Rating summary */}
            {totalReviews > 0 && (
              <div className="flex items-start gap-6 mb-8 p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {listing.avg_rating > 0 ? listing.avg_rating.toFixed(1) : '0'}
                  </div>
                  <StarRating rating={listing.avg_rating} size={16} />
                  <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDist.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 w-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>{star}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#1A1726] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#E8970A]"
                          style={{ width: totalReviews ? `${(count / totalReviews) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs w-6 text-right" style={{ fontFamily: 'DM Sans, sans-serif' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review list */}
            {reviews.length > 0 ? (
              <div className="space-y-4 mb-8">
                {reviews.map((review) => (
                  <div key={review.id} className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {review.reviewer_name}
                      </span>
                      <span className="text-gray-500 text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                    {review.title && (
                      <h4 className="text-white font-semibold text-sm mt-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {review.title}
                      </h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-300 text-sm mt-1 leading-relaxed" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                No reviews yet. Be the first to review this business!
              </p>
            )}

            {/* Write a review form */}
            {submitted ? (
              <div className="p-6 rounded-xl bg-green-900/20 border border-green-500/20 text-center">
                <p className="text-green-400 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Thank you for your review! It will be published after moderation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="p-6 rounded-xl bg-[#0F0D1A] border border-[#1A1726] space-y-4">
                <h3 className="text-white font-semibold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Write a Review
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      value={reviewForm.reviewer_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Email</label>
                    <input
                      type="email"
                      value={reviewForm.reviewer_email}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewer_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                      style={{ fontFamily: 'DM Sans, sans-serif' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Rating *</label>
                  <StarRating rating={reviewForm.rating} size={24} interactive onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Title</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>Comment</label>
                  <textarea
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1A1726] border border-[#2A2736] text-white text-sm focus:outline-none focus:border-[#E8970A]/50 resize-none"
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl font-medium text-black transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#E8970A', fontFamily: 'DM Sans, sans-serif' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="p-5 rounded-xl bg-[#0F0D1A] border border-[#1A1726] space-y-3">
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Share2 size={16} className="text-[#E8970A]" />
              Share
            </button>
            <Link
              href={`mailto:support@indianprograms.com?subject=Report: ${listing.name}`}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Flag size={16} className="text-red-400" />
              Report Listing
            </Link>
            <Link
              href={`mailto:support@indianprograms.com?subject=Claim: ${listing.name}`}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <Shield size={16} className="text-green-400" />
              Claim This Business
            </Link>
          </div>

          {/* Map placeholder */}
          <div className="rounded-xl overflow-hidden border border-[#1A1726]">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
              <div className="aspect-square bg-[#0F0D1A] flex flex-col items-center justify-center text-center p-6">
                <MapPin size={32} className="text-[#E8970A] mb-3" />
                <p className="text-white text-sm font-medium mb-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {listing.city}, {listing.state}
                </p>
                <p className="text-gray-400 text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {listing.address_line1}
                </p>
                <p className="text-[#E8970A] text-xs mt-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  Open in Google Maps →
                </p>
              </div>
            </a>
          </div>

          {/* Related listings */}
          {related.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Related Businesses
              </h3>
              <div className="space-y-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/directory/listing/${r.id}`}
                    className="flex gap-3 p-3 rounded-xl bg-[#0F0D1A] border border-[#1A1726] hover:border-[#E8970A]/30 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-lg bg-[#1A1726] flex-shrink-0 overflow-hidden">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg">🏪</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white text-sm font-medium truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {r.name}
                      </h4>
                      <StarRating rating={r.avg_rating} size={12} />
                      <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {r.city}, {r.state}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
