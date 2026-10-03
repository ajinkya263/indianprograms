import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingDetailClient from './ListingDetailClient'

interface Props {
  params: { id: string }
}

export default async function ListingPage({ params }: Props) {
  const supabase = createServerSupabaseClient()
  const { id } = params

  const { data: listing } = await supabase
    .from('directory_listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!listing) return notFound()

  const { data: category } = await supabase
    .from('directory_categories')
    .select('*')
    .eq('key', listing.category_key)
    .single()

  const { data: reviews } = await supabase
    .from('directory_reviews')
    .select('*')
    .eq('listing_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const { data: related } = await supabase
    .from('directory_listings')
    .select('*')
    .eq('status', 'published')
    .eq('category_key', listing.category_key)
    .neq('id', id)
    .limit(3)

  return (
    <div className="min-h-screen bg-[#070510]">
      <Navbar />
      <ListingDetailClient
        listing={listing}
        category={category}
        reviews={reviews || []}
        related={related || []}
      />
      <Footer />
    </div>
  )
}
