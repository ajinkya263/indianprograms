'use client'

import { useState } from 'react'
import RsvpDashboard from '@/components/RsvpDashboard'
import RsvpConfigPanel from '@/components/RsvpConfigPanel'
import type { EventTier, EventRsvp, RsvpStatus } from '@/lib/rsvp'

interface Props {
  token: string
  event: any
  initialTiers: EventTier[]
  initialRsvps: EventRsvp[]
}

export default function GuestManagementClient({ token, event, initialTiers, initialRsvps }: Props) {
  const [tiers, setTiers] = useState(initialTiers)
  const [rsvps, setRsvps] = useState(initialRsvps)
  const [cfg, setCfg] = useState({
    rsvp_enabled: !!event.rsvp_enabled,
    rsvp_deadline: event.rsvp_deadline || '',
    rsvp_capacity: event.rsvp_capacity ?? '',
    payment_link: event.payment_link || '',
    payment_instructions: event.payment_instructions || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function callManage(body: any) {
    const resp = await fetch('/api/rsvp-manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, token, event_id: event.id }),
    })
    const data = await resp.json()
    if (!resp.ok || !data?.ok) throw new Error(data?.error || 'Update failed')
    return data
  }

  async function refresh() {
    const resp = await fetch(`/api/rsvp-manage?event_id=${event.id}&token=${encodeURIComponent(token)}`)
    if (resp.ok) {
      const data = await resp.json()
      if (data.rsvps) setRsvps(data.rsvps)
      if (data.tiers) setTiers(data.tiers)
    }
  }

  async function onStatusChange(rsvpId: string, next: RsvpStatus) {
    try {
      await callManage({ action: 'set_rsvp_status', rsvp_id: rsvpId, status: next })
      setRsvps((prev) => prev.map((r) => r.id === rsvpId ? { ...r, status: next, checked_in_at: next === 'attended' ? new Date().toISOString() : null } : r))
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  async function saveConfig() {
    setSaving(true); setMsg(null)
    try {
      await callManage({
        action: 'update_event_rsvp_config',
        rsvp_enabled: cfg.rsvp_enabled,
        rsvp_deadline: cfg.rsvp_deadline || null,
        rsvp_capacity: cfg.rsvp_capacity === '' ? null : cfg.rsvp_capacity,
        payment_link: cfg.payment_link,
        payment_instructions: cfg.payment_instructions,
      })
      setMsg('Saved.')
    } catch (e: any) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function upsertTier(tier: Partial<EventTier>) {
    try {
      await callManage({ action: 'upsert_tier', tier })
      // Optimistic refresh via re-fetch (simple + correct).
      const resp = await fetch(`/api/rsvp-manage?event_id=${event.id}&token=${encodeURIComponent(token)}`)
      if (resp.ok) {
        const data = await resp.json()
        if (data.tiers) setTiers(data.tiers)
      } else {
        // Fallback: local upsert.
        setTiers((prev) => {
          if (tier.id) return prev.map((t) => t.id === tier.id ? { ...t, ...tier } as EventTier : t)
          return [...prev, { ...tier, id: 'tmp-' + Date.now(), event_id: event.id, sort_order: prev.length } as EventTier]
        })
      }
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  async function deleteTier(tierId: string) {
    try {
      await callManage({ action: 'delete_tier', tier_id: tierId })
      setTiers((prev) => prev.filter((t) => t.id !== tierId))
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div>
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Guest event management</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {event.title}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{event.date} · {event.city}</p>
      </div>

      <RsvpConfigPanel
        cfg={cfg}
        setCfg={setCfg}
        tiers={tiers}
        onSave={saveConfig}
        onUpsertTier={upsertTier}
        onDeleteTier={deleteTier}
        saving={saving}
        msg={msg}
      />

      {cfg.rsvp_enabled && (
        <RsvpDashboard
          eventTitle={event.title}
          eventDate={event.date}
          tiers={tiers}
          rsvps={rsvps}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  )
}
