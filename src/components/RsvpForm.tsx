'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { EventTier } from '@/lib/rsvp'

interface RsvpFormProps {
  eventId: string
  eventTitle: string
  paymentLink: string
  paymentInstructions: string
  tiers: EventTier[]
}

export default function RsvpForm({
  eventId,
  eventTitle,
  paymentLink,
  paymentInstructions,
  tiers,
}: RsvpFormProps) {
  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentConfirmation, setPaymentConfirmation] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [result, setResult] = useState<{ code: string; status: string } | null>(null)

  const tier = tiers.find((t) => t.id === selectedTierId) || null
  const isPaid = tier ? Number(tier.price) > 0 : false
  const lineTotal = tier ? Number(tier.price) * quantity : 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)
    try {
      const resp = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          tier_id: selectedTierId || null,
          attendee_name: name,
          attendee_email: email,
          attendee_phone: phone,
          quantity,
          payment_confirmation: paymentConfirmation,
          notes,
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) {
        setErrorMsg(data?.error || 'RSVP failed. Please try again.')
        setSubmitting(false)
        return
      }
      setResult({ code: data.confirmation_code, status: data.status })
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const statusMsg = {
      confirmed: 'You\'re on the list.',
      pending:   'RSVP received. Complete payment and reply with your confirmation number.',
      waitlist:  'This tier is full — you\'re on the waitlist. We\'ll notify you if a slot opens.',
      cancelled: 'Cancelled.',
      attended:  'Checked in.',
    }[result.status] || 'RSVP recorded.'
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6 sm:p-8 bg-[#0F0D1A] border-[#1A1726] text-center space-y-4"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <div className="text-3xl">🎫</div>
        <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
          {statusMsg}
        </h2>
        <div
          className="mx-auto max-w-xs px-4 py-3 rounded-lg text-lg font-mono tracking-widest border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            color: 'var(--text-primary)',
          }}
        >
          {result.code}
        </div>
        <p className="text-gray-400 text-sm">
          Confirmation code — save it, or check your email. Show it at the door.
        </p>
      </motion.div>
    )
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A] transition-colors'
  const labelClass = 'block text-xs text-gray-400 mb-1.5'

  return (
    <form onSubmit={submit} className="space-y-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {tiers.length > 0 && (
        <div>
          <label className={labelClass}>Ticket tier</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tiers.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedTierId(t.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedTierId === t.id ? 'text-black' : 'text-gray-300 border-[#1A1726]'
                }`}
                style={{
                  backgroundColor: selectedTierId === t.id ? 'var(--accent)' : '#0F0D1A',
                  borderColor: selectedTierId === t.id ? 'var(--accent)' : undefined,
                }}
              >
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs opacity-80">
                  {Number(t.price) > 0 ? `$${Number(t.price).toFixed(2)}` : 'Free'}
                  {t.capacity != null && ` · ${t.capacity} cap`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Your name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Optional" />
        </div>
        <div>
          <label className={labelClass}>Seats</label>
          <input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className={inputClass} />
        </div>
      </div>

      {isPaid && (
        <div
          className="p-4 rounded-xl border space-y-3"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Payment required</div>
              <div className="text-xs text-gray-400">
                {quantity} × ${Number(tier!.price).toFixed(2)} = <span className="text-white">${lineTotal.toFixed(2)}</span>
              </div>
            </div>
            {paymentLink && (
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-saffron"
              >
                Pay now →
              </a>
            )}
          </div>
          {paymentInstructions && (
            <div className="text-xs text-gray-400 whitespace-pre-wrap">{paymentInstructions}</div>
          )}
          <div>
            <label className={labelClass}>Payment confirmation number *</label>
            <input
              required
              value={paymentConfirmation}
              onChange={(e) => setPaymentConfirmation(e.target.value)}
              className={inputClass}
              placeholder="e.g. Venmo txn 8XR2A9 or Zelle #123456"
            />
            <div className="mt-1 text-[11px] text-gray-500">
              Paste the transaction ID / reference number from the payment app so the organizer can match your RSVP.
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Notes for the organizer</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} placeholder="Optional" />
      </div>

      {errorMsg && (
        <div className="text-sm text-red-400">{errorMsg}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg font-semibold text-black bg-saffron hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : `Confirm RSVP${tier && Number(tier.price) > 0 ? ` · $${lineTotal.toFixed(2)}` : ''}`}
      </button>
      <p className="text-xs text-gray-500 text-center">
        By RSVPing you agree to receive an email confirmation for {eventTitle}.
      </p>
    </form>
  )
}
