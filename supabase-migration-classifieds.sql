-- ============================================
-- Indian Business Directory / Classifieds
-- ============================================

-- Categories
CREATE TABLE IF NOT EXISTS public.directory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text DEFAULT '',
  emoji text DEFAULT '',
  icon text DEFAULT '',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Seed 17 categories
INSERT INTO public.directory_categories (key, label, description, emoji, icon, sort_order) VALUES
  ('restaurants', 'Indian Restaurants', 'Dine-in, takeout, catering, street food', '🍛', 'UtensilsCrossed', 1),
  ('grocery', 'Indian Grocery Stores', 'Spices, snacks, fresh produce, frozen foods', '🛒', 'ShoppingCart', 2),
  ('temples', 'Temples & Religious Places', 'Hindu temples, gurdwaras, mosques, churches', '🛕', 'Church', 3),
  ('clothing', 'Indian Clothing & Fashion', 'Sarees, kurtas, lehengas, accessories', '👗', 'Shirt', 4),
  ('jewelry', 'Jewelry Stores', 'Gold, diamond, kundan, fashion jewelry', '💎', 'Gem', 5),
  ('cultural_classes', 'Cultural Classes', 'Dance, music, art, painting, language classes', '🎨', 'GraduationCap', 6),
  ('tutors', 'Tutors & Education', 'Academic tutoring, test prep, coaching', '📚', 'BookOpen', 7),
  ('tours_travel', 'Tours & Travel', 'Travel agencies, tour operators, visa services', '✈️', 'Plane', 8),
  ('insurance', 'Insurance Services', 'Life, health, auto, home insurance agents', '🛡️', 'Shield', 9),
  ('puja_pandits', 'Puja Pandits & Priests', 'Hindu priests, puja services, religious ceremonies', '🙏', 'Flame', 10),
  ('event_rentals', 'Event Rentals', 'Tent, decor, catering equipment, DJ, sound', '🎪', 'PartyPopper', 11),
  ('cultural_centers', 'Indian Cultural Centers', 'Community halls, cultural organizations', '🏛️', 'Building2', 12),
  ('sports_clubs', 'Sports Clubs & Venues', 'Cricket, badminton, soccer, volleyball', '🏏', 'Trophy', 13),
  ('rentals', 'Desi Rentals', 'Apartments, rooms, shared housing', '🏠', 'Home', 14),
  ('embassies', 'Indian Embassies & Consulates', 'Embassy, consulate, passport services', '🇮🇳', 'Flag', 15),
  ('notaries', 'Notary Services', 'Document notarization, attestation', '📋', 'FileCheck', 16),
  ('shops', 'All Indian Shops & Services', 'Other Indian businesses and services', '🏪', 'Store', 17)
ON CONFLICT (key) DO NOTHING;

-- Listings
CREATE TABLE IF NOT EXISTS public.directory_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.directory_categories(id),
  category_key text NOT NULL,

  -- Basic info
  name text NOT NULL,
  description text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',

  -- Address
  address_line1 text DEFAULT '',
  address_line2 text DEFAULT '',
  city text NOT NULL,
  metro_region text DEFAULT '',
  state text NOT NULL,
  zip_code text DEFAULT '',
  country text DEFAULT 'US',

  -- Map
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  google_maps_url text DEFAULT '',

  -- Media
  image_url text DEFAULT '',
  images text[] DEFAULT '{}',
  logo_url text DEFAULT '',

  -- Business details
  hours_json jsonb DEFAULT '{}'::jsonb,
  price_range text DEFAULT '' CHECK (price_range IN ('', '$', '$$', '$$$', '$$$$')),
  specialties text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  payment_methods text[] DEFAULT '{}',
  cuisine_types text[] DEFAULT '{}',

  -- Ratings
  avg_rating numeric(3, 2) DEFAULT 0,
  review_count integer DEFAULT 0,

  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'suspended')),
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'crawler', 'import')),
  rejection_reason text DEFAULT '',

  -- Submitter
  submitted_by_name text DEFAULT '',
  submitted_by_email text DEFAULT '',
  submitted_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_owner_claimed boolean DEFAULT false,

  -- Metadata
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON public.directory_listings(category_key);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.directory_listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_metro ON public.directory_listings(metro_region);
CREATE INDEX IF NOT EXISTS idx_listings_state ON public.directory_listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.directory_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_rating ON public.directory_listings(avg_rating);

ALTER TABLE public.directory_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published listings" ON public.directory_listings;
CREATE POLICY "Public read published listings" ON public.directory_listings FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Auth users insert listings" ON public.directory_listings;
CREATE POLICY "Auth users insert listings" ON public.directory_listings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage listings" ON public.directory_listings;
CREATE POLICY "Admins manage listings" ON public.directory_listings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.directory_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text DEFAULT '',
  reviewer_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  comment text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.directory_reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.directory_reviews(status);

ALTER TABLE public.directory_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published reviews" ON public.directory_reviews;
CREATE POLICY "Public read published reviews" ON public.directory_reviews FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.directory_reviews;
CREATE POLICY "Anyone can submit reviews" ON public.directory_reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage reviews" ON public.directory_reviews;
CREATE POLICY "Admins manage reviews" ON public.directory_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
