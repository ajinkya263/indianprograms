import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMetaOAuthUrl } from '@/lib/meta-api'

/**
 * GET /api/social/oauth/meta/start
 *
 * Initiates the Facebook/Instagram OAuth flow.
 * Redirects the user to Facebook's permission grant screen.
 *
 * After the user grants permissions, Facebook will redirect them back to
 * /api/social/oauth/meta/callback with a code we can exchange for tokens.
 */
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/social/accounts', request.url))
  }

  if (!process.env.META_APP_ID) {
    return NextResponse.json({
      error: 'Meta integration not configured. Set META_APP_ID and META_APP_SECRET in .env.local',
    }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const redirectUri = `${baseUrl}/api/social/oauth/meta/callback`

  // State token: includes user ID so we can verify on callback.
  // In production, this should be a signed JWT or stored in DB.
  const state = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString('base64url')

  try {
    const oauthUrl = getMetaOAuthUrl(redirectUri, state)
    return NextResponse.redirect(oauthUrl)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
