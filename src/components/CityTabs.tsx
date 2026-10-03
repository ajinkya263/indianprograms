'use client'

import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Metro selector row.
 *
 * Renders a horizontally-scrollable pill row of major US Indian-community
 * metros with Bay Area always first (the site's home region). Selection is
 * fully client-side — the parent owns the `city` state and re-runs its own
 * filter logic when it changes.
 *
 * Non-Bay-Area metros may have zero events for a while as the crawler
 * ramps up coverage; the pill still shows so the user can see the roadmap.
 */

interface CityTabsProps {
  city: string
  onCityChange: (city: string) => void
}

// Curated list of metros to surface at the top. Full metro definitions
// (with alias cities) live in src/lib/constants.ts and drive the actual
// filter matching — this array just controls which pills appear.
const METROS: { key: string; label: string }[] = [
  { key: 'Bay Area', label: 'Bay Area' },
  { key: 'LA', label: 'Los Angeles' },
  { key: 'New York', label: 'New York' },
  { key: 'Seattle', label: 'Seattle' },
  { key: 'Chicago', label: 'Chicago' },
  { key: 'Houston', label: 'Houston' },
  { key: 'Dallas', label: 'Dallas-Fort Worth' },
  { key: 'Boston', label: 'Boston' },
  { key: 'DC', label: 'Washington DC' },
  { key: 'Atlanta', label: 'Atlanta' },
  { key: 'NJ', label: 'New Jersey' },
  { key: 'Austin', label: 'Austin' },
]

export default function CityTabs({ city, onCityChange }: CityTabsProps) {
  return (
    <div className="flex items-center gap-1.5 pb-1 overflow-x-auto scrollbar-hide">
      {METROS.map((m) => {
        const active = city === m.key
        return (
          <button
            key={m.key}
            onClick={() => onCityChange(m.key)}
            className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 flex-shrink-0 ${
              active ? 'text-black' : 'text-gray-400 border border-dark-border hover:text-white'
            }`}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <motion.span
                layoutId="cityActive"
                className="absolute inset-0 rounded-full bg-saffron"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <MapPin size={11} className={`relative z-10 ${active ? 'text-black/70' : ''}`} />
            <span className="relative z-10">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
