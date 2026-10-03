import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function generateSlug(length = 6): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { destination_url, slug, title, description, expires_at, event_id } = body

  if (!destination_url) {
    return NextResponse.json({ error: 'destination_url is required' }, { status: 400 })
  }

  // Match the client's normalization: bare hostnames like "cnn.com" get
  // a https:// scheme prepended so `new URL(...)` accepts them.
  const trimmedDest = String(destination_url).trim()
  const normalizedDest = /^https?:\/\//i.test(trimmedDest) ? trimmedDest : `https://${trimmedDest}`
  try {
    new URL(normalizedDest)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let finalSlug = slug?.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || ''
  if (!finalSlug) {
    for (let i = 0; i < 5; i++) {
      const candidate = generateSlug()
      const { data: existing } = await supabase.from('short_links').select('id').eq('slug', candidate).single()
      if (!existing) {
        finalSlug = candidate
        break
      }
    }
    if (!finalSlug) {
      return NextResponse.json({ error: 'Could not generate unique slug' }, { status: 500 })
    }
  } else {
    const { data: existing } = await supabase.from('short_links').select('id').eq('slug', finalSlug).single()
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
  }

  const { data, error } = await supabase
    .from('short_links')
    .insert({
      user_id: user.id,
      slug: finalSlug,
      destination_url: normalizedDest,
      title: title || '',
      description: description || '',
      expires_at: expires_at || null,
      event_id: event_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
