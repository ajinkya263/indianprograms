'use client'

interface DateStripProps {
  selectedFilter: string
  onSelect: (filter: string) => void
}

const FILTERS = [
  'All Dates',
  'Today',
  'Tomorrow',
  'This Weekend',
  'This Week',
  'This Month',
]

export default function DateStrip({ selectedFilter, onSelect }: DateStripProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span
        className="text-sm text-gray-500 mr-2 whitespace-nowrap"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        When:
      </span>
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedFilter === f
              ? 'bg-saffron text-black'
              : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
          }`}
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
