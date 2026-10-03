import type { Event } from './types'

// Metro areas with their center coordinates and constituent cities
export const METRO_AREAS = [
  {
    key: 'All Cities',
    label: 'All Cities',
    lat: 39.8283,
    lng: -98.5795,
    cities: [],
  },
  {
    key: 'New York',
    label: 'New York',
    lat: 40.7128,
    lng: -74.0060,
    cities: ['new york', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'long island', 'yonkers', 'new rochelle', 'white plains'],
  },
  {
    key: 'NJ',
    label: 'New Jersey',
    lat: 40.0583,
    lng: -74.4057,
    cities: ['new jersey', 'nj', 'jersey city', 'newark', 'hoboken', 'edison', 'princeton', 'trenton', 'parsippany', 'piscataway', 'woodbridge', 'iselin'],
  },
  {
    key: 'Bay Area',
    label: 'Bay Area',
    lat: 37.7749,
    lng: -122.4194,
    cities: ['san francisco', 'bay area', 'san jose', 'oakland', 'fremont', 'sunnyvale', 'santa clara', 'cupertino', 'mountain view', 'palo alto', 'milpitas', 'east bay', 'south bay', 'redwood city', 'hayward', 'berkeley', 'pleasanton', 'dublin', 'livermore', 'union city'],
  },
  {
    key: 'LA',
    label: 'Los Angeles',
    lat: 34.0522,
    lng: -118.2437,
    cities: ['los angeles', 'la', 'pasadena', 'long beach', 'anaheim', 'irvine', 'santa monica', 'burbank', 'glendale', 'torrance', 'cerritos', 'artesia', 'orange county', 'riverside', 'san bernardino', 'pomona', 'ontario', 'corona', 'fullerton'],
  },
  {
    key: 'Chicago',
    label: 'Chicago',
    lat: 41.8781,
    lng: -87.6298,
    cities: ['chicago', 'naperville', 'schaumburg', 'evanston', 'aurora', 'joliet', 'bolingbrook', 'bloomington', 'normal', 'peoria'],
  },
  {
    key: 'Houston',
    label: 'Houston',
    lat: 29.7604,
    lng: -95.3698,
    cities: ['houston', 'sugar land', 'katy', 'the woodlands', 'pearland', 'pasadena tx', 'league city', 'baytown'],
  },
  {
    key: 'Seattle',
    label: 'Seattle',
    lat: 47.6062,
    lng: -122.3321,
    cities: ['seattle', 'bellevue', 'redmond', 'kirkland', 'renton', 'tacoma', 'everett', 'bothell', 'issaquah'],
  },
  {
    key: 'Dallas',
    label: 'Dallas-Fort Worth',
    lat: 32.7767,
    lng: -96.7970,
    cities: ['dallas', 'fort worth', 'plano', 'irving', 'arlington', 'frisco', 'mckinney', 'denton', 'richardson', 'garland', 'dfw'],
  },
  {
    key: 'Miami',
    label: 'South Florida',
    lat: 25.7617,
    lng: -80.1918,
    cities: ['miami', 'fort lauderdale', 'boca raton', 'west palm beach', 'coral gables', 'hialeah', 'pompano beach', 'south florida', 'hollywood fl'],
  },
  {
    key: 'Boston',
    label: 'Boston',
    lat: 42.3601,
    lng: -71.0589,
    cities: ['boston', 'cambridge', 'somerville', 'brookline', 'newton', 'quincy', 'waltham', 'framingham', 'marlborough', 'new england'],
  },
  {
    key: 'DC',
    label: 'Washington DC',
    lat: 38.9072,
    lng: -77.0369,
    cities: ['washington', 'dc', 'washington dc', 'arlington', 'alexandria', 'bethesda', 'silver spring', 'rockville', 'fairfax', 'reston', 'baltimore', 'columbia md'],
  },
  {
    key: 'Austin',
    label: 'Austin',
    lat: 30.2672,
    lng: -97.7431,
    cities: ['austin', 'round rock', 'cedar park', 'georgetown', 'san marcos', 'pflugerville'],
  },
  {
    key: 'Atlanta',
    label: 'Atlanta',
    lat: 33.7490,
    lng: -84.3880,
    cities: ['atlanta', 'marietta', 'decatur', 'alpharetta', 'roswell', 'johns creek', 'duluth ga', 'kennesaw', 'greenville sc'],
  },
  // NEW CITIES (from BMM mandals and more)
  {
    key: 'San Antonio',
    label: 'San Antonio',
    lat: 29.4241,
    lng: -98.4936,
    cities: ['san antonio', 'new braunfels'],
  },
  {
    key: 'San Diego',
    label: 'San Diego',
    lat: 32.7157,
    lng: -117.1611,
    cities: ['san diego', 'chula vista', 'oceanside', 'carlsbad', 'escondido'],
  },
  {
    key: 'Phoenix',
    label: 'Phoenix',
    lat: 33.4484,
    lng: -112.0740,
    cities: ['phoenix', 'scottsdale', 'tempe', 'mesa', 'chandler', 'gilbert'],
  },
  {
    key: 'Detroit',
    label: 'Detroit',
    lat: 42.3314,
    lng: -83.0458,
    cities: ['detroit', 'ann arbor', 'dearborn', 'troy', 'novi', 'canton', 'lansing', 'mid michigan'],
  },
  {
    key: 'Philadelphia',
    label: 'Philadelphia',
    lat: 39.9526,
    lng: -75.1652,
    cities: ['philadelphia', 'philly', 'king of prussia', 'cherry hill', 'harrisburg', 'central penn'],
  },
  {
    key: 'Denver',
    label: 'Denver',
    lat: 39.7392,
    lng: -104.9903,
    cities: ['denver', 'boulder', 'aurora co', 'colorado springs', 'colorado'],
  },
  {
    key: 'Columbus',
    label: 'Columbus',
    lat: 39.9612,
    lng: -82.9988,
    cities: ['columbus', 'columbus oh'],
  },
  {
    key: 'Minneapolis',
    label: 'Minneapolis',
    lat: 44.9778,
    lng: -93.2650,
    cities: ['minneapolis', 'st paul', 'minnesota', 'bloomington mn'],
  },
  {
    key: 'Research Triangle',
    label: 'Research Triangle',
    lat: 35.8992,
    lng: -78.8637,
    cities: ['raleigh', 'durham', 'chapel hill', 'rtp', 'cary', 'research triangle'],
  },
  {
    key: 'Charlotte',
    label: 'Charlotte',
    lat: 35.2271,
    lng: -80.8431,
    cities: ['charlotte', 'concord nc', 'gastonia'],
  },
  {
    key: 'Tampa',
    label: 'Tampa Bay',
    lat: 27.9506,
    lng: -82.4572,
    cities: ['tampa', 'st petersburg', 'clearwater'],
  },
  {
    key: 'Orlando',
    label: 'Orlando',
    lat: 28.5383,
    lng: -81.3792,
    cities: ['orlando', 'kissimmee', 'sanford', 'central florida'],
  },
  {
    key: 'Pittsburgh',
    label: 'Pittsburgh',
    lat: 40.4406,
    lng: -79.9959,
    cities: ['pittsburgh'],
  },
  {
    key: 'Cleveland',
    label: 'Cleveland',
    lat: 41.4993,
    lng: -81.6944,
    cities: ['cleveland', 'akron', 'northeast ohio'],
  },
  {
    key: 'Cincinnati',
    label: 'Cincinnati',
    lat: 39.1031,
    lng: -84.5120,
    cities: ['cincinnati', 'dayton'],
  },
  {
    key: 'Indianapolis',
    label: 'Indianapolis',
    lat: 39.7684,
    lng: -86.1581,
    cities: ['indianapolis', 'indiana'],
  },
  {
    key: 'Milwaukee',
    label: 'Milwaukee',
    lat: 43.0389,
    lng: -87.9065,
    cities: ['milwaukee', 'waukesha', 'racine', 'kenosha'],
  },
  {
    key: 'St Louis',
    label: 'St. Louis',
    lat: 38.6270,
    lng: -90.1994,
    cities: ['st louis', 'st. louis'],
  },
  {
    key: 'Sacramento',
    label: 'Sacramento',
    lat: 38.5816,
    lng: -121.4944,
    cities: ['sacramento'],
  },
  {
    key: 'Other',
    label: 'Other Cities',
    lat: 39.8283,
    lng: -98.5795,
    cities: [],
  },
] as const

export type MetroAreaKey = (typeof METRO_AREAS)[number]['key']

// Keep CITIES as an array of keys for backwards compatibility
export const CITIES = METRO_AREAS.map(m => m.key)

// Legacy type alias
export type City = string

// Helper: find which metro area a city string belongs to
export function findMetroArea(cityStr: string): string {
  if (!cityStr) return 'Other'
  const normalized = cityStr.toLowerCase().trim()
  for (const metro of METRO_AREAS) {
    if (metro.key === 'All Cities' || metro.key === 'Other') continue
    if (metro.key.toLowerCase() === normalized) return metro.key
    if (metro.cities.some(c => normalized.includes(c) || c.includes(normalized))) {
      return metro.key
    }
  }
  return 'Other'
}

// Helper: get metro area data by key
export function getMetroArea(key: string) {
  return METRO_AREAS.find(m => m.key === key)
}

// Helper: check if an event's city matches a metro area
export function cityMatchesMetro(eventCity: string, metroKey: string): boolean {
  if (metroKey === 'All Cities') return true
  const metro = getMetroArea(metroKey)
  if (!metro) return false
  const normalized = eventCity.toLowerCase().trim()
  if (metro.key.toLowerCase() === normalized) return true
  return metro.cities.some(c => normalized.includes(c) || c.includes(normalized))
}

// Helper: check if an event's city is an exact/close match to a specific city string
export function cityMatchesExact(eventCity: string, specificCity: string): boolean {
  if (!specificCity) return false
  const a = eventCity.toLowerCase().trim()
  const b = specificCity.toLowerCase().trim()
  return a === b || a.includes(b) || b.includes(a)
}

// Sort events: exact city matches first, then rest of metro by date
export function sortEventsByCity(events: Event[], priorityCity: string): Event[] {
  if (!priorityCity) return events
  return [...events].sort((a, b) => {
    const aExact = cityMatchesExact(a.city, priorityCity) ? 0 : 1
    const bExact = cityMatchesExact(b.city, priorityCity) ? 0 : 1
    if (aExact !== bExact) return aExact - bExact
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

// Haversine distance in miles between two lat/lng points
export function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Find the nearest metro area to given coordinates
export function findNearestMetro(lat: number, lng: number): string {
  let nearest = 'All Cities'
  let minDist = Infinity
  for (const metro of METRO_AREAS) {
    if (metro.key === 'All Cities' || metro.key === 'Other') continue
    const dist = getDistanceMiles(lat, lng, metro.lat, metro.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = metro.key
    }
  }
  // Only auto-select if within 100 miles of a metro center
  return minDist <= 100 ? nearest : 'All Cities'
}

// Workshop removed — out of scope per site policy.
export const CATEGORIES = [
  { key: 'festival', label: 'Festival', emoji: '🪔', gradient: 'from-orange-500 to-red-600' },
  { key: 'dance', label: 'Dance', emoji: '💃', gradient: 'from-pink-500 to-purple-600' },
  { key: 'vocal', label: 'Vocal', emoji: '🎤', gradient: 'from-blue-500 to-indigo-600' },
  { key: 'instrumental', label: 'Instrumental', emoji: '🎵', gradient: 'from-teal-500 to-cyan-600' },
  { key: 'movies', label: 'Movies', emoji: '🎬', gradient: 'from-red-500 to-rose-600' },
  { key: 'competition', label: 'Competition', emoji: '🏆', gradient: 'from-yellow-500 to-amber-600' },
  { key: 'standup', label: 'Stand-up', emoji: '😂', gradient: 'from-green-500 to-emerald-600' },
  { key: 'play', label: 'Play', emoji: '🎭', gradient: 'from-fuchsia-500 to-pink-600' },
  { key: 'poetry', label: 'Poetry', emoji: '📜', gradient: 'from-amber-500 to-orange-600' },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']

export function getCategoryMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0]
}

/**
 * Indian languages surfaced in the filter and required on the submit
 * form. Order roughly follows community size in North America.
 */
export const LANGUAGES = [
  { key: 'Hindi',       label: 'Hindi' },
  { key: 'Marathi',     label: 'Marathi' },
  { key: 'Gujarati',    label: 'Gujarati' },
  { key: 'Tamil',       label: 'Tamil' },
  { key: 'Telugu',      label: 'Telugu' },
  { key: 'Bengali',     label: 'Bengali' },
  { key: 'Punjabi',     label: 'Punjabi' },
  { key: 'Kannada',     label: 'Kannada' },
  { key: 'Malayalam',   label: 'Malayalam' },
  { key: 'Urdu',        label: 'Urdu' },
  { key: 'Sanskrit',    label: 'Sanskrit' },
  { key: 'Odia',        label: 'Odia' },
  { key: 'Assamese',    label: 'Assamese' },
  { key: 'Konkani',     label: 'Konkani' },
  { key: 'Sindhi',      label: 'Sindhi' },
  { key: 'Kashmiri',    label: 'Kashmiri' },
  { key: 'Rajasthani',  label: 'Rajasthani' },
  { key: 'Bhojpuri',    label: 'Bhojpuri' },
  { key: 'Multilingual', label: 'Multilingual' },
  { key: 'English',     label: 'English' },
] as const

export type LanguageKey = (typeof LANGUAGES)[number]['key']

/**
 * Best-effort language detection from title + description. Used by the
 * crawler to pre-fill the language column when it's obvious; when
 * nothing matches confidently we leave it blank so admin can pick.
 */
export function detectEventLanguage(title: string, description: string): string {
  const t = `${title || ''} ${description || ''}`.toLowerCase()
  const rules: [RegExp, string][] = [
    [/\b(marathi|मराठी|abhang|natak\b|nataka|dhol\s*lezim|ganeshotsav|gudi\s*padwa|kojagiri|wari|jugalbandi|maharashtra\s+mandal)\b/i, 'Marathi'],
    [/\b(gujarati|ગુજરાતી|garba|dandiya|raas|gujjubhai|navratri)\b/i, 'Gujarati'],
    [/\b(tamil|தமிழ்|tamil\s+sangam|tamil\s+sangha|whistle\s+podu|carnatic)\b/i, 'Tamil'],
    [/\b(telugu|తెలుగు|telugu\s+association|andhra)\b/i, 'Telugu'],
    [/\b(bengali|বাংলা|durga\s*puj|bongo|nabc|bhadra|rabindranath|rabindra\s*sangeet)\b/i, 'Bengali'],
    [/\b(punjabi|ਪੰਜਾਬੀ|bhangra|teeyan|teeyain|baisakhi|vaisakhi|gurpurab)\b/i, 'Punjabi'],
    [/\b(kannada|ಕನ್ನಡ|kannadigara|kannada\s+sangha)\b/i, 'Kannada'],
    [/\b(malayalam|മലയാളം|onam|malayalee|nair\s+service|kerala)\b/i, 'Malayalam'],
    [/\b(urdu|اردو|mushaira|qawwali|shayari|ghazal|nazm)\b/i, 'Urdu'],
    [/\b(sanskrit|संस्कृत|shloka|shlokas|vedic\s+recitation)\b/i, 'Sanskrit'],
    [/\b(odia|oriya|jagannath|odissi)\b/i, 'Odia'],
    [/\b(assamese|অসমীয়া|bihu)\b/i, 'Assamese'],
    [/\b(konkani)\b/i, 'Konkani'],
    // Hindi last — Bollywood is the biggest catch-all, but many rows above
    // are also Hindi-adjacent; the more specific keyword wins.
    [/\b(hindi|हिंदी|bollywood|hindustani|bhajan|filmi|kirtan|hindi\s+comedy)\b/i, 'Hindi'],
  ]
  for (const [re, lang] of rules) {
    if (re.test(t)) return lang
  }
  return ''
}

/**
 * Normalize a title down to its first 3 alphanumeric tokens — used as a
 * loose duplicate key so "Bollywood Nights at Salesforce Park - Free"
 * and "Bollywood Nights - Salesforce Park - Free" group together.
 */
export function eventGroupKey(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 3)
    .join(' ')
}

/**
 * Group recurring events by title so the homepage shows a Bollywood
 * Nights card once with "+N more dates" instead of one card per date.
 *
 * The representative event is the earliest upcoming one (so today's
 * user sees the next date they can attend). Extra dates are sorted
 * chronologically and returned alongside — the card renders a
 * "+N more dates" chip and the tooltip shows the full list.
 */
export function groupEventsByTitle<T extends { title: string; date: string; image_url?: string; venue?: string }>(
  events: T[],
): (T & { extraDates: string[] })[] {
  const groups = new Map<string, T[]>()
  for (const e of events) {
    const key = eventGroupKey(e.title)
    if (!key) continue
    const bucket = groups.get(key) || []
    bucket.push(e)
    groups.set(key, bucket)
  }
  const out: (T & { extraDates: string[] })[] = []
  Array.from(groups.values()).forEach((bucket: T[]) => {
    // Sort by date so the earliest upcoming date wins as representative.
    bucket.sort((a: T, b: T) => (a.date || '').localeCompare(b.date || ''))
    // Prefer a rep that has a poster image (bumps the earliest one to
    // the front if a later date has one but the earliest doesn't).
    const rep =
      bucket.find((e: T) => e.image_url && e.image_url.length > 6) || bucket[0]
    const extraDates = bucket.filter((e: T) => e !== rep).map((e: T) => e.date).filter(Boolean)
    out.push({ ...rep, extraDates })
  })
  // Re-sort groups by the rep's date so the grid stays chronological.
  out.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  return out
}

export function getShortId(id: string): string {
  return id.replace(/-/g, '').substring(0, 7)
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
