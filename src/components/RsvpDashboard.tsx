'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Users, Download } from 'lucide-react'
import { aggregateRsvps, computeTierOccupancy } from '@/lib/rsvp'
import type { EventTier, EventRsvp, RsvpStatus } from '@/lib/rsvp'

/**
 * Shared RSVP dashboard — used by both the registered publisher view
 * (/dashboard/rsvps) and the guest publisher magic-link view (/g/[token]).
 * Parent controls how each mutation reaches the server (the two use
 * different API bases + auth); this component only knows about the
 * callbacks.
 */
interface Props {
  eventTitle: string
  eventDate: string
  tiers: EventTier[]
  rsvps: EventRsvp[]
  onStatusChange?: (rsvpId: string, next: RsvpStatus) => Promise<void>
}

const STATUS_ORDER: RsvpStatus[] = ['confirmed', 'pending', 'waitlist', 'attended', 'cancelled']
const STATUS_LABEL: Record<RsvpStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  waitlist: 'Waitlist',
  attended: 'Attended',
  cancelled: 'Cancelled',
}
const STATUS_COLOR: Record<RsvpStatus, string> = {
  confirmed: '#4F8C4F',
  pending: '#E8970A',
  waitlist: '#A0522D',
  attended: '#2E7D32',
  cancelled: '#7B6C55',
}

export default function RsvpDashboard({ eventTitle, eventDate, tiers, rsvps, onStatusChange }: Props) {
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const agg = useMemo(() => aggregateRsvps(rsvps, tiers), [rsvps, tiers])
  const occupancy = useMemo(() => computeTierOccupancy(tiers, rsvps), [tiers, rsvps])

  const filteredRsvps = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rsvps
      .filter((r) => statusFilter === 'all' ? true : r.status === statusFilter)
      .filter((r) =>
        !q
          ? true
          : r.attendee_name.toLowerCase().includes(q) ||
            r.attendee_email.toLowerCase().includes(q) ||
            r.confirmation_code.toLowerCase().includes(q),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [rsvps, statusFilter, search])

  function downloadCsv() {
    const rows = [
      ['confirmation_code', 'status', 'name', 'email', 'phone', 'tier', 'quantity', 'payment_confirmation', 'notes', 'created_at', 'checked_in_at'],
      ...rsvps.map((r) => {
        const tierName = tiers.find((t) => t.id === r.tier_id)?.name || ''
        return [
          r.confirmation_code, r.status, r.attendee_name, r.attendee_email, r.attendee_phone,
          tierName, String(r.quantity), r.payment_confirmation, r.notes, r.created_at, r.checked_in_at || '',
        ]
      }),
    ]
    const csv = rows.map((row) => row.map((c) => {
      const s = (c ?? '').toString()
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvps-${eventTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${eventDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* Aggregate counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CountCard label="Total RSVPs" value={agg.total} icon={<Users size={16} />} />
        <CountCard label="Confirmed seats" value={agg.seatsConfirmed} icon={<CheckCircle2 size={16} />} />
        <CountCard label="Pending" value={agg.pending} icon={<Clock size={16} />} />
        <CountCard label="Reported $" value={`$${agg.reportedRevenue.toFixed(2)}`} icon={<CheckCircle2 size={16} />} accent />
      </div>

      {/* Per-tier occupancy */}
      {occupancy.length > 0 && (
        <div className="rounded-xl border p-4 bg-[#0F0D1A] border-[#1A1726]">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">By tier</div>
          <div className="space-y-2">
            {occupancy.map((o) => (
              <div key={o.tier.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {o.tier.name} · {Number(o.tier.price) > 0 ? `$${Number(o.tier.price).toFixed(2)}` : 'Free'}
                  </div>
                </div>
                <div className="text-sm text-gray-300 flex-shrink-0">
                  {o.seatsTaken}
                  {o.tier.capacity != null && ` / ${o.tier.capacity}`}
                </div>
                {o.waitlistCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'rgba(160, 82, 45, 0.2)', color: 'var(--accent)' }}>
                    +{o.waitlistCount} waitlist
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? 'text-black bg-saffron' : 'text-gray-400 border border-dark-border hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s as RsvpStatus]}
              {s !== 'all' && (
                <span className="ml-1 opacity-70">{agg[s as RsvpStatus]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[180px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or code…"
            className="w-full px-3 py-1.5 rounded-lg bg-[#0F0D1A] border border-[#1A1726] text-white text-sm"
          />
        </div>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dark-border text-gray-400 hover:text-white"
        >
          <Download size={13} />
          CSV
        </button>
      </div>

      {/* Attendee list */}
      <div className="rounded-xl border bg-[#0F0D1A] border-[#1A1726] overflow-hidden">
        {filteredRsvps.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No RSVPs match the current filter.</div>
        ) : (
          <ul>
            {filteredRsvps.map((r, i) => {
              const tier = tiers.find((t) => t.id === r.tier_id)
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.24) }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-[#1A1726] last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{r.attendee_name}</span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: STATUS_COLOR[r.status] + '30',
                          color: STATUS_COLOR[r.status],
                        }}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {r.attendee_email}
                      {r.attendee_phone && ` · ${r.attendee_phone}`}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {tier ? `${tier.name} × ${r.quantity}` : `× ${r.quantity}`}
                      {' · '}
                      <span className="font-mono">{r.confirmation_code}</span>
                      {r.payment_confirmation && (
                        <span> · pay: <span className="font-mono">{r.payment_confirmation}</span></span>
                      )}
                    </div>
                    {r.notes && (
                      <div className="text-[11px] text-gray-500 mt-1 italic">"{r.notes}"</div>
                    )}
                  </div>
                  {onStatusChange && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {r.status !== 'attended' && (r.status === 'confirmed' || r.status === 'pending') && (
                        <button
                          onClick={() => onStatusChange(r.id, 'attended')}
                          className="px-2.5 py-1 rounded text-xs font-medium border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          title="Mark as checked in"
                        >
                          Check in
                        </button>
                      )}
                      {r.status === 'waitlist' && (
                        <button
                          onClick={() => onStatusChange(r.id, 'confirmed')}
                          className="px-2.5 py-1 rounded text-xs font-medium border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Promote
                        </button>
                      )}
                      {r.status === 'pending' && (
                        <button
                          onClick={() => onStatusChange(r.id, 'confirmed')}
                          className="px-2.5 py-1 rounded text-xs font-medium border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Confirm
                        </button>
                      )}
                      {r.status !== 'cancelled' && (
                        <button
                          onClick={() => onStatusChange(r.id, 'cancelled')}
                          className="p-1.5 rounded border border-dark-border text-gray-500 hover:text-red-400"
                          title="Cancel this RSVP"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function CountCard({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-xl border p-3 bg-[#0F0D1A] border-[#1A1726]"
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1" style={{ color: accent ? 'var(--accent)' : undefined }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  )
}
