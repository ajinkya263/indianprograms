/**
 * Format a stored event time for display.
 *
 * The crawler stores time in a variety of shapes — "03:00 PM", "15:00", "7:30",
 * "TBD", etc. The previous formatter parsed the hour then *always* re-derived
 * AM/PM from the integer, which silently turned "03:00 PM" into "3:00 AM".
 *
 * Rules:
 *  1. Empty or non-colon input → return as-is (or "TBA" if empty).
 *  2. Input that already contains an AM/PM marker → keep that marker, just
 *     normalize spacing and zero-pad minutes.
 *  3. Bare 24h input → convert to 12h with the correct AM/PM.
 */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return 'TBA'
  const t = String(timeStr).trim()
  if (!t.includes(':')) return t || 'TBA'

  const ampmMatch = t.match(/\b(AM|PM|am|pm)\b/)
  const [rawH, rawM] = t.split(':')
  const hours = parseInt(rawH, 10)
  if (isNaN(hours)) return t
  const minutes = (rawM?.replace(/[^0-9]/g, '') || '00').padStart(2, '0')

  if (ampmMatch) {
    // Already explicit — preserve the meridiem the source provided.
    const meridiem = ampmMatch[1].toUpperCase()
    // Hour could be either 1-12 (12h notation) or 13-23 if the source
    // double-encoded it ("15:00 PM"). Normalize either way to 1-12.
    let h = hours
    if (h > 12) h = h - 12
    if (h === 0) h = 12
    return `${h}:${minutes} ${meridiem}`
  }

  // 24h → 12h
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes} ${meridiem}`
}
