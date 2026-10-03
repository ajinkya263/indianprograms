'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BEST_POSTING_TIMES } from '@/lib/posting-times'
import { Clock } from 'lucide-react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function BestTimesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            <Clock size={28} />
            Best Posting Times
          </h1>
          <p className="text-gray-400 mt-1 text-sm">When to post for maximum engagement on each platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(BEST_POSTING_TIMES).map(([platform, data]) => (
            <div key={platform} className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5">
              <h3 className="font-semibold text-white text-lg capitalize mb-1">{platform}</h3>
              <p className="text-xs text-gray-500 mb-4">{data.description}</p>

              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Best Days</div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div
                      key={day}
                      className={`flex-1 text-center py-2 rounded text-xs font-medium ${
                        data.bestDays.includes(day as never)
                          ? 'bg-[#E8970A]/20 text-[#E8970A] border border-[#E8970A]/30'
                          : 'bg-[#070510] text-gray-600 border border-[#1A1726]'
                      }`}
                    >
                      {DAY_NAMES[day]}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Best Hours</div>
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const ampm = hour >= 12 ? 'PM' : 'AM'
                    const h12 = hour % 12 || 12
                    const isBest = data.bestHours.includes(hour as never)
                    return (
                      <div
                        key={hour}
                        className={`text-center py-1.5 rounded text-xs ${
                          isBest
                            ? 'bg-[#E8970A]/20 text-[#E8970A] border border-[#E8970A]/30 font-medium'
                            : 'bg-[#070510] text-gray-600'
                        }`}
                      >
                        {h12}{ampm[0]}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-[#0F0D1A]/50 border border-[#1A1726] rounded-xl p-5">
          <p className="text-sm text-gray-400">
            <strong className="text-white">Tip:</strong> These times are based on industry research for the Indian diaspora audience in US time zones. As you publish more posts and gather analytics, the system will refine recommendations based on your specific audience.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
