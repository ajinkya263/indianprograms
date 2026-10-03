export interface Profile {
  id: string
  name: string
  email: string
  role: 'visitor' | 'publisher' | 'admin'
  slug: string | null
  bio: string
  suspended: boolean
  joined_at: string
}

export interface Event {
  id: string
  title: string
  category: string
  description: string
  venue: string
  address: string
  city: string
  metro_region: string
  state: string
  zip_code: string
  date: string
  time: string
  ticket_url: string
  price: 'Free' | 'Paid'
  language: string
  image_url: string
  source: 'manual' | 'crawler'
  rsvp_enabled?: boolean
  rsvp_deadline?: string | null
  rsvp_capacity?: number | null
  payment_link?: string
  payment_instructions?: string
  guest_edit_token?: string | null
  crawler_confidence?: number
  confidence_details?: Record<string, any>
  confidence_100_count?: number
  auto_approved?: boolean
  last_scored_at?: string | null
  status: 'pending' | 'published' | 'rejected'
  publisher_id: string
  publisher_name: string
  submitted_at: string
  rejection_feedback: string
  submitter_email: string
}
