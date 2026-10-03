'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, METRO_AREAS, findMetroArea, LANGUAGES } from '@/lib/constants'
import { Upload, Trash2 } from 'lucide-react'

const metroOptions = METRO_AREAS.filter((m) => m.key !== 'All Cities')

const METRO_STATE_MAP: Record<string, string> = {
  'New York': 'New York', 'NJ': 'New Jersey', 'Bay Area': 'California',
  'LA': 'California', 'Chicago': 'Illinois', 'Houston': 'Texas',
  'Seattle': 'Washington', 'Dallas': 'Texas', 'Miami': 'Florida',
  'Boston': 'Massachusetts', 'DC': 'DC', 'Austin': 'Texas',
  'Atlanta': 'Georgia', 'San Antonio': 'Texas',
  'San Diego': 'California', 'Phoenix': 'Arizona', 'Detroit': 'Michigan',
  'Philadelphia': 'Pennsylvania', 'Denver': 'Colorado', 'Columbus': 'Ohio',
  'Minneapolis': 'Minnesota', 'Research Triangle': 'North Carolina',
  'Charlotte': 'North Carolina', 'Tampa': 'Florida', 'Orlando': 'Florida',
  'Pittsburgh': 'Pennsylvania', 'Cleveland': 'Ohio', 'Cincinnati': 'Ohio',
  'Indianapolis': 'Indiana', 'Milwaukee': 'Wisconsin', 'St Louis': 'Missouri',
  'Sacramento': 'California',
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'DC', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana',
  'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
  'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
]

interface EventForm {
  title: string
  category: string
  description: string
  venue: string
  address: string
  city: string
  metro_region: string
  state: string
  zip_code: string
  date: string
  timeHour: string
  timeMinute: string
  timeAmPm: 'AM' | 'PM'
  ticket_url: string
  price: 'Free' | 'Paid'
  language: string
  image_url: string
}

const defaultForm: EventForm = {
  title: '',
  category: CATEGORIES[0].key,
  description: '',
  venue: '',
  address: '',
  city: '',
  metro_region: metroOptions[0].key,
  state: '',
  zip_code: '',
  date: '',
  timeHour: '',
  timeMinute: '00',
  timeAmPm: 'PM',
  ticket_url: '',
  price: 'Free',
  language: '',
  image_url: '',
}

// Parse address components from a full address string using free Nominatim geocoding
async function geocodeAddress(address: string): Promise<{ city: string; state: string; zip_code: string; metro_region: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1&countrycodes=us`,
      { headers: { 'User-Agent': 'ICATUAC-EventApp/1.0' } }
    )
    const data = await res.json()
    if (!data || data.length === 0) return null

    const addr = data[0].address
    const city = addr.city || addr.town || addr.village || addr.hamlet || ''
    const state = addr.state || ''
    const zip_code = addr.postcode?.split('-')[0] || ''
    const metro_region = findMetroArea(city) || 'Other'

    return { city, state, zip_code, metro_region }
  } catch {
    return null
  }
}

export default function SubmitEventPage() {
  const supabase = createClient()

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [form, setForm] = useState<EventForm>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string>('')
  const [successEmail, setSuccessEmail] = useState<string | null>(null)
  const [successEditUrl, setSuccessEditUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)

  // Optional RSVP configuration
  const [rsvpEnabled, setRsvpEnabled] = useState(false)
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [rsvpCapacity, setRsvpCapacity] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [paymentInstructions, setPaymentInstructions] = useState('')
  const [tiers, setTiers] = useState<{ name: string; price: string; capacity: string }[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)

    const timeStr = form.timeHour ? `${form.timeHour}:${form.timeMinute} ${form.timeAmPm}` : ''

    let imageUrl = form.image_url

    if (posterFile) {
      const filePath = `guest/${Date.now()}-${posterFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(filePath, posterFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('event-posters')
          .getPublicUrl(filePath)
        imageUrl = urlData.publicUrl
      } else {
        setErrorMsg('Failed to upload poster image. Please try again.')
        setSubmitting(false)
        return
      }
    }

    // Server-side insert via /api/submit-guest-event — the route uses
    // the service-role key, sets status='pending' regardless, and hands
    // back a friendly error if validation fails.
    try {
      const resp = await fetch('/api/submit-guest-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          description: form.description,
          venue: form.venue,
          address: form.address,
          city: form.city,
          metro_region: form.metro_region,
          state: form.state,
          zip_code: form.zip_code,
          date: form.date,
          time: timeStr,
          ticket_url: form.ticket_url,
          price: form.price,
          language: form.language,
          image_url: imageUrl,
          guestName,
          guestEmail,
          rsvp_enabled: rsvpEnabled,
          rsvp_deadline: rsvpDeadline || null,
          rsvp_capacity: rsvpCapacity || null,
          payment_link: paymentLink,
          payment_instructions: paymentInstructions,
          tiers: rsvpEnabled ? tiers.filter((t) => t.name.trim()) : [],
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) {
        setErrorMsg(data?.error || 'Failed to submit event. Please try again.')
        setSubmitting(false)
        return
      }
      setSuccessEditUrl(data.edit_url || null)
    } catch {
      setErrorMsg('Network error. Please try again.')
      setSubmitting(false)
      return
    }

    setSuccessEmail(guestEmail)
    setSubmitting(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A] transition-colors'
  const labelClass = 'block text-sm text-gray-400 mb-1.5'

  if (successEmail) {
    return (
      <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl p-8 sm:p-12">
            <div className="text-4xl mb-4">&#10003;</div>
            <h1
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: 'Playfair Display, serif', color: '#E8970A' }}
            >
              Event Submitted!
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Thank you! Your event has been submitted for review. We&apos;ll notify you at{' '}
              <span className="text-white font-medium">{successEmail}</span> once it&apos;s approved.
            </p>
            {successEditUrl && (
              <div className="mt-6 text-left rounded-xl border border-[#1A1726] bg-[#070510] p-4">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Your management link</div>
                <div className="text-xs text-gray-400 mb-2">
                  Save this URL — it&apos;s the only way to manage your event and, if you enabled RSVP, see your registrations. We also emailed it to you.
                </div>
                <a
                  href={successEditUrl}
                  className="block px-3 py-2 rounded font-mono text-xs break-all"
                  style={{ backgroundColor: '#0F0D1A', color: '#E8970A' }}
                >
                  {successEditUrl}
                </a>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Playfair Display, serif', color: '#E8970A' }}
          >
            Submit an Event
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Share an Indian cultural event with the community. No registration required.
          </p>
        </div>

        <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ═══ STEP 1: What's the event? ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8970A] text-black text-xs font-bold">1</span>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">What&apos;s the event?</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Event Title</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g., Diwali Celebration 2026, Bollywood Night, Carnatic Music Concert" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                      {CATEGORIES.map((cat) => <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Primary Language</label>
                    <select required value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={inputClass}>
                      <option value="" disabled>Select language</option>
                      {LANGUAGES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="What can attendees expect? Include details like performers, activities, food, dress code, etc." />
                </div>
              </div>
            </div>

            <div className="border-t border-[#1A1726]" />

            {/* ═══ STEP 2: When? ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8970A] text-black text-xs font-bold">2</span>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">When is it?</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Date</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Start Time</label>
                  <div className="flex gap-2">
                    <select required value={form.timeHour} onChange={(e) => setForm({ ...form, timeHour: e.target.value })} className={inputClass}>
                      <option value="">Hour</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={String(h)}>{h}</option>)}
                    </select>
                    <span className="text-gray-500 self-center text-lg font-bold">:</span>
                    <select value={form.timeMinute} onChange={(e) => setForm({ ...form, timeMinute: e.target.value })} className={inputClass}>
                      {['00', '15', '30', '45'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={form.timeAmPm} onChange={(e) => setForm({ ...form, timeAmPm: e.target.value as 'AM' | 'PM' })} className={inputClass}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1A1726]" />

            {/* ═══ STEP 3: Where? ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8970A] text-black text-xs font-bold">3</span>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Where is it?</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Venue / Hall Name <span className="text-gray-500 font-normal">(optional)</span></label>
                  <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={inputClass} placeholder="e.g., Chabot College Auditorium, BAPS Mandir — leave blank if outdoor or private" />
                </div>

                <div>
                  <label className={labelClass}>Street Address</label>
                  <input
                    type="text" required value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    onBlur={async (e) => {
                      const addr = e.target.value.trim()
                      if (!addr || addr.length < 5) return
                      setAddressLoading(true)
                      const result = await geocodeAddress(addr)
                      if (result) {
                        setForm((prev) => ({
                          ...prev,
                          city: result.city || prev.city,
                          state: result.state || prev.state,
                          zip_code: result.zip_code || prev.zip_code,
                          metro_region: result.metro_region !== 'Other' ? result.metro_region : prev.metro_region,
                        }))
                      }
                      setAddressLoading(false)
                    }}
                    className={inputClass}
                    placeholder="e.g., 1234 Main St, Fremont, CA 94536"
                  />
                  {addressLoading ? (
                    <p className="text-xs text-[#E8970A] mt-1">Detecting city, state, and zip...</p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">City, state, and zip will be auto-filled when you enter the address</p>
                  )}
                </div>

                {/* Auto-detected location — collapsed into a subtle section */}
                <div className="bg-[#070510] rounded-lg p-4 space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Location details {form.city && <span className="text-[#E8970A] normal-case">(auto-filled — edit if needed)</span>}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">City</label>
                      <input type="text" required value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        onBlur={(e) => {
                          const detected = findMetroArea(e.target.value)
                          if (detected && detected !== 'Other') {
                            setForm((prev) => ({ ...prev, metro_region: detected, ...(prev.state === '' && METRO_STATE_MAP[detected] ? { state: METRO_STATE_MAP[detected] } : {}) }))
                          }
                        }}
                        className={inputClass} placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Metro Region</label>
                      <select required value={form.metro_region}
                        onChange={(e) => {
                          const metro = e.target.value
                          setForm((prev) => ({ ...prev, metro_region: metro, ...(prev.state === '' && METRO_STATE_MAP[metro] ? { state: METRO_STATE_MAP[metro] } : {}) }))
                        }}
                        className={inputClass}
                      >
                        {metroOptions.map((metro) => <option key={metro.key} value={metro.key}>{metro.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">State</label>
                      <select required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass}>
                        <option value="">Select state</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Zip Code</label>
                      <input type="text" required value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className={inputClass} placeholder="e.g., 94536" pattern="\d{5}" title="5-digit US zip code" maxLength={5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1A1726]" />

            {/* ═══ STEP 4: How do people attend? ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8970A] text-black text-xs font-bold">4</span>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Tickets &amp; Registration</h2>
              </div>
            </div>

            <div>
              <label className={labelClass}>Is this event free or paid?</label>
              <div className="flex gap-6 mt-1">
                {(['Free', 'Paid'] as const).map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      value={option}
                      checked={form.price === option}
                      onChange={() => {
                        setForm({ ...form, price: option })
                        if (option === 'Free') {
                          setPaymentLink('')
                          setPaymentInstructions('')
                        }
                      }}
                      className="accent-[#E8970A]"
                    />
                    <span className="text-sm text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Registration: Ticket URL or RSVP — user picks one */}
            <div className="rounded-xl border p-5 border-[#1A1726] bg-[#0F0D1A] space-y-4">
              <div>
                <div className="text-sm font-semibold text-white mb-1">How will people register?</div>
                <p className="text-xs text-gray-500">Choose one option below.</p>
              </div>

              {/* Option 1: External ticket URL */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="registration_type"
                  checked={!rsvpEnabled}
                  onChange={() => setRsvpEnabled(false)}
                  className="accent-[#E8970A] mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-300 font-medium">External ticket / registration link</div>
                  <p className="text-xs text-gray-500 mt-0.5">Attendees will be directed to Eventbrite, your website, or any other registration page.</p>
                  {!rsvpEnabled && (
                    <input
                      type="text"
                      required={!rsvpEnabled}
                      value={form.ticket_url}
                      onChange={(e) => setForm({ ...form, ticket_url: e.target.value })}
                      className={`${inputClass} mt-2`}
                      placeholder="https://www.eventbrite.com/... or your registration page"
                    />
                  )}
                </div>
              </label>

              {/* Option 2: RSVP via IndianPrograms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="registration_type"
                  checked={rsvpEnabled}
                  onChange={() => setRsvpEnabled(true)}
                  className="accent-[#E8970A] mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm text-gray-300 font-medium">Collect RSVPs on IndianPrograms</div>
                  <p className="text-xs text-gray-500 mt-0.5">We&apos;ll create an RSVP form on your event page. You can set capacity limits and track registrations. No money is processed by IndianPrograms.</p>
                </div>
              </label>

              {/* RSVP options — only shown when RSVP is selected */}
              {rsvpEnabled && (
                <div className="space-y-4 pt-2 ml-7 border-l-2 border-[#1A1726] pl-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>RSVP deadline (optional)</label>
                      <input
                        type="datetime-local"
                        value={rsvpDeadline}
                        onChange={(e) => setRsvpDeadline(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Capacity (optional)</label>
                      <input
                        type="number"
                        min={1}
                        value={rsvpCapacity}
                        onChange={(e) => setRsvpCapacity(e.target.value)}
                        placeholder="Leave blank for unlimited"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Tiers — only for Paid events */}
                  {form.price === 'Paid' && (
                    <div>
                      <label className={labelClass}>Ticket tiers</label>
                      <div className="space-y-2">
                        {tiers.map((t, i) => (
                          <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                            <input value={t.name} onChange={(e) => setTiers((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g., General, VIP" className={inputClass} />
                            <input type="number" min={0} step="0.01" value={t.price} onChange={(e) => setTiers((prev) => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="$" className={inputClass} />
                            <input type="number" min={1} value={t.capacity} onChange={(e) => setTiers((prev) => prev.map((x, j) => j === i ? { ...x, capacity: e.target.value } : x))} placeholder="Cap" className={inputClass} />
                            <button type="button" onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))} className="p-2 rounded border border-[#1A1726] text-gray-500 hover:text-red-400">
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTiers((prev) => [...prev, { name: '', price: '', capacity: '' }])}
                          className="text-xs px-3 py-1.5 rounded border border-[#1A1726] text-gray-400 hover:text-white"
                        >
                          + Add tier
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment fields — only for Paid events */}
                  {form.price === 'Paid' && (
                    <>
                      <div>
                        <label className={labelClass}>Your payment link (Venmo, Zelle, PayPal, etc.)</label>
                        <input
                          value={paymentLink}
                          onChange={(e) => setPaymentLink(e.target.value)}
                          placeholder="https://venmo.com/yourhandle"
                          className={inputClass}
                        />
                        <p className="text-xs text-gray-600 mt-1">Attendees will see this link and pay you directly. We do not process any payments.</p>
                      </div>
                      <div>
                        <label className={labelClass}>Payment instructions for attendees (optional)</label>
                        <textarea
                          rows={2}
                          value={paymentInstructions}
                          onChange={(e) => setPaymentInstructions(e.target.value)}
                          placeholder='e.g., "Pay via Venmo @yourname with your full name in the note."'
                          className={inputClass}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-[#1A1726]" />

            {/* ═══ STEP 5: Event Poster ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8970A] text-black text-xs font-bold">5</span>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Event Poster <span className="text-gray-500 font-normal normal-case">(optional but recommended)</span></h2>
              </div>

              <div
                className="relative bg-[#0F0D1A] border border-dashed border-[#1A1726] hover:border-[#E8970A]/50 rounded-lg transition-colors cursor-pointer"
                style={{ height: '200px' }}
                onClick={() => document.getElementById('poster-upload')?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation()
                  const file = e.dataTransfer.files?.[0]
                  if (!file) return
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return
                  if (file.size > 5 * 1024 * 1024) { alert('File size must be under 5MB.'); return }
                  setPosterFile(file)
                  setPosterPreview(URL.createObjectURL(file))
                }}
              >
                <input id="poster-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) { alert('File size must be under 5MB.'); e.target.value = ''; return }
                    setPosterFile(file)
                    setPosterPreview(URL.createObjectURL(file))
                    e.target.value = ''
                  }}
                />
                {posterPreview ? (
                  <div className="relative w-full h-full">
                    <img src={posterPreview} alt="Poster preview" className="w-full h-full object-contain rounded-lg" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                    <Upload size={28} className="text-gray-600" />
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-600 text-center px-4">Events with posters get 3x more views. Max 5MB. JPG or PNG.</p>
                  </div>
                )}
              </div>
              {posterPreview && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setPosterFile(null); setPosterPreview(''); setForm({ ...form, image_url: '' }) }}
                  className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>

            <div className="border-t border-[#1A1726]" />

            {/* ═══ STEP 6: Your Info ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E8970A] text-black text-xs font-bold">6</span>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Your Contact Info</h2>
              </div>
              <p className="text-xs text-gray-500 mb-3">Your info is only used to notify you about your event&apos;s review status. It will not be shown publicly.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your Name</label>
                  <input type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} className={inputClass} placeholder="Your full name" />
                </div>
                <div>
                  <label className={labelClass}>Your Email</label>
                  <input type="email" required value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={inputClass} placeholder="you@email.com" />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg font-medium text-sm text-black transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E8970A' }}
              >
                {submitting ? 'Submitting...' : 'Submit Event for Review'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
