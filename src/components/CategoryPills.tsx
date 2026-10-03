'use client'

import { CATEGORIES } from '@/lib/constants'

interface CategoryPillsProps {
  selectedCategory: string | null
  onSelect: (category: string | null) => void
}

export default function CategoryPills({ selectedCategory, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* All pill */}
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          selectedCategory === null
            ? 'text-black'
            : 'text-gray-300 border hover:text-white hover:border-gray-500'
        }`}
        style={{
          backgroundColor: selectedCategory === null ? '#E8970A' : '#0F0D1A',
          borderColor: selectedCategory === null ? undefined : '#1A1726',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        All
      </button>

      {/* Category pills */}
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategory === cat.key
              ? 'text-black'
              : 'text-gray-300 border hover:text-white hover:border-gray-500'
          }`}
          style={{
            backgroundColor: selectedCategory === cat.key ? '#E8970A' : '#0F0D1A',
            borderColor: selectedCategory === cat.key ? undefined : '#1A1726',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  )
}
