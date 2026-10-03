import type { MetadataRoute } from 'next'

const BASE_URL = 'https://indianprograms.com'

// Directory category keys from directory_categories table
const DIRECTORY_CATEGORIES = [
  'restaurants',
  'grocery',
  'temples',
  'clothing',
  'jewelry',
  'cultural_classes',
  'tutors',
  'tours_travel',
  'insurance',
  'puja_pandits',
  'event_rentals',
  'cultural_centers',
  'sports_clubs',
  'rentals',
  'embassies',
  'notaries',
  'shops',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/directory`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/shortlinks`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/social`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/directory/submit`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/social/hashtags`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/social/bio`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guest-events`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // Directory category pages
  const directoryRoutes: MetadataRoute.Sitemap = DIRECTORY_CATEGORIES.map(
    (category) => ({
      url: `${BASE_URL}/directory/${category}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })
  )

  return [...staticRoutes, ...directoryRoutes]
}
