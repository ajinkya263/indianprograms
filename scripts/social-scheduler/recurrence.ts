import type { ScheduledPost } from '../../src/lib/social-types'

/**
 * Calculate the next run time for a recurring post.
 *
 * Supports multiple times of day per occurrence — if the post should fire
 * at 9 AM and 3 PM every Monday, this advances through the time slots
 * before moving to the next day.
 */
export function calculateNextRun(post: ScheduledPost, lastRun: Date): Date | null {
  if (post.schedule_type !== 'recurring') return null

  // Check if we've hit max runs or end date
  if (post.recurrence_max_runs && (post.total_runs || 0) + 1 >= post.recurrence_max_runs) return null
  if (post.recurrence_end_date && new Date(post.recurrence_end_date) < new Date()) return null

  const interval = post.recurrence_interval || 1
  const times = (post.recurrence_times_of_day || []).filter(Boolean)
  const sortedTimes = times.length > 0 ? [...times].sort() : ['09:00']

  // Try to find another time slot on the same day first
  if (sortedTimes.length > 1) {
    const lastHM = `${String(lastRun.getHours()).padStart(2, '0')}:${String(lastRun.getMinutes()).padStart(2, '0')}`
    const nextSameDayTime = sortedTimes.find(t => t > lastHM)
    if (nextSameDayTime) {
      const sameDay = new Date(lastRun)
      const [hh, mm] = nextSameDayTime.split(':').map(Number)
      sameDay.setHours(hh, mm, 0, 0)
      return validateAndReturn(sameDay, post)
    }
  }

  // Otherwise advance to the next eligible day
  const next = new Date(lastRun)
  const [firstHH, firstMM] = sortedTimes[0].split(':').map(Number)
  next.setHours(firstHH, firstMM, 0, 0)

  switch (post.recurrence_pattern) {
    case 'daily':
      next.setDate(next.getDate() + interval)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval)
      if (post.recurrence_days_of_week?.length) {
        for (let i = 0; i < 7; i++) {
          if (post.recurrence_days_of_week.includes(next.getDay())) break
          next.setDate(next.getDate() + 1)
        }
      }
      break
    case 'monthly':
      next.setMonth(next.getMonth() + interval)
      break
    default:
      return null
  }

  return validateAndReturn(next, post)
}

function validateAndReturn(d: Date, post: ScheduledPost): Date | null {
  // Don't return a date that's still in the past (loop protection)
  if (d.getTime() < Date.now() - 60_000) return null
  // Don't go past end_date
  if (post.recurrence_end_date && d > new Date(post.recurrence_end_date)) return null
  return d
}
