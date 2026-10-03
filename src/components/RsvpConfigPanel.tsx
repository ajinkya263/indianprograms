'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { EventTier } from '@/lib/rsvp'

interface Props {
  cfg: {
    rsvp_enabled: boolean
    rsvp_deadline: string
    rsvp_capacity: number | string
    payment_link: string
    payment_instructions: string
  }
  setCfg: (updater: (prev: Props['cfg']) => Props['cfg']) => void
  tiers: EventTier[]
  onSave: () => Promise<void>
  onUpsertTier: (tier: Partial<EventTier>) => Promise<void>
  onDeleteTier: (tierId: string) => Promise<void>
  saving: boolean
  msg: string | null
}

/**
 * Editable RSVP config panel used inside the guest management page and,
 * eventually, the registered publisher dashboard too. Same shape either
 * way — this component only talks to callback props, so parents can
 * swap the API layer under it.
 */
export default function RsvpConfigPanel({
  cfg, setCfg, tiers, onSave, onUpsertTier, onDeleteTier, saving, msg,
}: Props) {
  const [newTier, setNewTier] = useState({ name: '', price: '', capacity: '' })

  async function addTier() {
    if (!newTier.name.trim()) return
    await onUpsertTier({
      name: newTier.name,
      price: Number(newTier.price) || 0,
      capacity: newTier.capacity ? Number(newTier.capacity) : null,
      sort_order: tiers.length,
    } as any)
    setNewTier({ name: '', price: '', capacity: '' })
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A] transition-colors'
  const labelClass = 'block text-xs text-gray-400 mb-1.5'

  return (
    <div className="rounded-xl border p-5 sm:p-6 bg-[#0F0D1A] border-[#1A1726] space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">RSVP / ticketing</div>
          <div className="text-xs text-gray-500">Off by default. Turn on to accept attendee registrations.</div>
        </div>
        <button
          type="button"
          onClick={() => setCfg((p) => ({ ...p, rsvp_enabled: !p.rsvp_enabled }))}
          className={`relative w-11 h-6 rounded-full transition-colors ${cfg.rsvp_enabled ? 'bg-saffron' : 'bg-[#1A1726]'}`}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: cfg.rsvp_enabled ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {cfg.rsvp_enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>RSVP deadline (optional)</label>
              <input
                type="datetime-local"
                value={cfg.rsvp_deadline}
                onChange={(e) => setCfg((p) => ({ ...p, rsvp_deadline: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Overall capacity (optional)</label>
              <input
                type="number"
                min={1}
                value={cfg.rsvp_capacity}
                onChange={(e) => setCfg((p) => ({ ...p, rsvp_capacity: e.target.value }))}
                className={inputClass}
                placeholder="Unlimited"
              />
            </div>
          </div>

          {/* Tiers */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-gray-500 mt-2">Ticket tiers</div>
            {tiers.length === 0 && (
              <div className="text-xs text-gray-500 italic">No tiers yet. Free events can leave this blank; a single implicit "General · Free" tier will be used.</div>
            )}
            {tiers.map((t) => (
              <TierRow key={t.id} tier={t} onSave={onUpsertTier} onDelete={onDeleteTier} />
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_auto] gap-2 pt-2">
              <input value={newTier.name} onChange={(e) => setNewTier({ ...newTier, name: e.target.value })} placeholder="Tier name (e.g. General)" className={inputClass} />
              <input type="number" min={0} step="0.01" value={newTier.price} onChange={(e) => setNewTier({ ...newTier, price: e.target.value })} placeholder="Price $" className={inputClass} />
              <input type="number" min={1} value={newTier.capacity} onChange={(e) => setNewTier({ ...newTier, capacity: e.target.value })} placeholder="Capacity" className={inputClass} />
              <button type="button" onClick={addTier} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-black bg-saffron">
                <Plus size={14} />Add
              </button>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Payment link (required if any tier is paid)</label>
              <input
                value={cfg.payment_link}
                onChange={(e) => setCfg((p) => ({ ...p, payment_link: e.target.value }))}
                placeholder="https://venmo.com/yourhandle or Stripe checkout URL"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Payment instructions for attendees (optional)</label>
              <textarea
                rows={3}
                value={cfg.payment_instructions}
                onChange={(e) => setCfg((p) => ({ ...p, payment_instructions: e.target.value }))}
                placeholder="e.g. Pay via Venmo @host — include your name in the note. Paste the Venmo transaction ID below."
                className={inputClass}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3">
        {msg && <div className="text-xs text-gray-400">{msg}</div>}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-saffron disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save RSVP settings'}
        </button>
      </div>
    </div>
  )
}

function TierRow({
  tier, onSave, onDelete,
}: {
  tier: EventTier
  onSave: (t: Partial<EventTier>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [name, setName] = useState(tier.name)
  const [price, setPrice] = useState(String(tier.price))
  const [capacity, setCapacity] = useState(tier.capacity == null ? '' : String(tier.capacity))
  const changed = name !== tier.name || price !== String(tier.price) || capacity !== (tier.capacity == null ? '' : String(tier.capacity))

  const inputClass = 'w-full px-3 py-2 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm focus:outline-none focus:border-[#E8970A]'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_auto_auto] gap-2 items-center">
      <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
      <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputClass} placeholder="Uncapped" />
      <button
        type="button"
        onClick={() => onSave({ id: tier.id, name, price: Number(price) || 0, capacity: capacity ? Number(capacity) : null } as any)}
        disabled={!changed}
        className="px-2.5 py-2 rounded text-xs font-medium text-black bg-saffron disabled:opacity-40"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => onDelete(tier.id)}
        className="p-2 rounded border border-dark-border text-gray-500 hover:text-red-400"
        title="Delete tier"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
