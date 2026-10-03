// Best posting times based on industry research for Indian diaspora audiences in US time zones.
// Hours are in 24h format. Days: 0=Sunday-6=Saturday.

export const BEST_POSTING_TIMES = {
  facebook: {
    bestDays: [3, 4, 5, 6],
    bestHours: [12, 13, 18, 19, 20],
    description: 'Evenings and weekends work best for Facebook',
  },
  instagram: {
    bestDays: [1, 2, 3, 5, 6],
    bestHours: [11, 13, 19, 20, 21],
    description: 'Lunch breaks and after dinner are peak Instagram times',
  },
  twitter: {
    bestDays: [1, 2, 3, 4],
    bestHours: [8, 9, 12, 17, 18],
    description: 'Morning commute and lunch are best for Twitter',
  },
  threads: {
    bestDays: [1, 2, 3, 4, 5],
    bestHours: [11, 13, 19, 21],
    description: 'Similar to Instagram but slightly later',
  },
  linkedin: {
    bestDays: [1, 2, 3, 4],
    bestHours: [8, 9, 10, 17, 18],
    description: 'Business hours, especially morning and end of day',
  },
  tiktok: {
    bestDays: [1, 2, 3, 5, 6],
    bestHours: [6, 10, 19, 22, 23],
    description: 'Early morning and late evening for TikTok',
  },
  youtube: {
    bestDays: [4, 5, 6],
    bestHours: [14, 15, 20, 21],
    description: 'Afternoons and Friday-Sunday for YouTube',
  },
} as const

export type Platform = keyof typeof BEST_POSTING_TIMES

export function getNextBestTime(platform: string, fromDate = new Date()): Date {
  const times = (BEST_POSTING_TIMES as any)[platform] || BEST_POSTING_TIMES.facebook
  const next = new Date(fromDate)

  for (let d = 0; d < 14; d++) {
    const day = next.getDay()
    if (times.bestDays.includes(day)) {
      for (const hour of times.bestHours) {
        const candidate = new Date(next)
        candidate.setHours(hour, 0, 0, 0)
        if (candidate > fromDate) return candidate
      }
    }
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
  }

  return new Date(fromDate.getTime() + 24 * 60 * 60 * 1000)
}

export function getOptimalSlots(platform: string, count = 5): Array<{ day: number; hour: number; label: string }> {
  const times = (BEST_POSTING_TIMES as any)[platform] || BEST_POSTING_TIMES.facebook
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const slots: Array<{ day: number; hour: number; label: string }> = []

  for (const day of times.bestDays) {
    for (const hour of times.bestHours) {
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour % 12 || 12
      slots.push({ day, hour, label: `${dayNames[day]} ${h12}:00 ${ampm}` })
      if (slots.length >= count) return slots
    }
  }

  return slots
}
