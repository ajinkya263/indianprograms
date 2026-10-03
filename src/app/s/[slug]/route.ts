import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: link } = await supabase
    .from('short_links')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!link) {
    return new NextResponse('Link not found', { status: 404 })
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return new NextResponse('Link expired', { status: 410 })
  }

  const userAgent = request.headers.get('user-agent') || ''
  const referrer = request.headers.get('referer') || ''

  supabase.from('short_link_clicks').insert({
    short_link_id: link.id,
    user_agent: userAgent.substring(0, 500),
    referrer: referrer.substring(0, 500),
  }).then(() => {})

  supabase
    .from('short_links')
    .update({ click_count: link.click_count + 1, last_clicked_at: new Date().toISOString() })
    .eq('id', link.id)
    .then(() => {})

  return NextResponse.redirect(link.destination_url)
}
