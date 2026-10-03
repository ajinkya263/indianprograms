import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  exchangeCodeForToken,
  getLongLivedUserToken,
  getUserPages,
  getInstagramAccount,
} from '@/lib/meta-api'
import { encrypt } from '@/lib/crypto'

/**
 * GET /api/social/oauth/meta/callback
 *
 * Facebook redirects here after the user grants/denies permissions.
 * Query params:
 *   - code: the authorization code (if granted)
 *   - state: our state token containing the user ID
 *   - error: if denied
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // User denied or other OAuth error
  if (error) {
    const url = new URL('/social/accounts', origin)
    url.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(url)
  }

  if (!code || !state) {
    const url = new URL('/social/accounts', origin)
    url.searchParams.set('error', 'Missing code or state from Facebook')
    return NextResponse.redirect(url)
  }

  // Decode state and verify user
  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
    if (!userId) throw new Error('No userId in state')
  } catch {
    const url = new URL('/social/accounts', origin)
    url.searchParams.set('error', 'Invalid state token')
    return NextResponse.redirect(url)
  }

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    const url = new URL('/login', origin)
    return NextResponse.redirect(url)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  const redirectUri = `${baseUrl}/api/social/oauth/meta/callback`

  try {
    // Step 1: Exchange code for short-lived user token
    const shortLivedToken = await exchangeCodeForToken(code, redirectUri)

    // Step 2: Exchange for long-lived user token (~60 days)
    const longLivedToken = await getLongLivedUserToken(shortLivedToken.access_token)

    // Step 3: Fetch all pages the user manages
    const pages = await getUserPages(longLivedToken.access_token)

    if (pages.length === 0) {
      const url = new URL('/social/accounts', origin)
      url.searchParams.set('error', 'No Facebook Pages found. You need to be an admin of at least one Facebook Page.')
      return NextResponse.redirect(url)
    }

    let connectedCount = 0

    // Step 4: For each page, store as a Facebook account and check for linked Instagram
    for (const page of pages) {
      try {
        const encryptedToken = encrypt(page.access_token)
        const tokenExpires = new Date(Date.now() + (longLivedToken.expires_in || 5184000) * 1000).toISOString()

        // Insert Facebook page
        await supabase.from('social_accounts').upsert({
          user_id: userId,
          platform: 'facebook',
          account_name: page.name,
          account_handle: page.id,
          external_account_id: page.id,
          access_token: encryptedToken,
          refresh_token: '',
          token_expires_at: tokenExpires,
          avatar_url: page.picture?.data?.url || '',
          is_active: true,
          metadata: { category: page.category, page_id: page.id },
        }, { onConflict: 'user_id,platform,external_account_id' })

        connectedCount++

        // Check for linked Instagram Business account
        const igAccount = await getInstagramAccount(page.id, page.access_token)
        if (igAccount) {
          await supabase.from('social_accounts').upsert({
            user_id: userId,
            platform: 'instagram',
            account_name: igAccount.username || page.name,
            account_handle: '@' + (igAccount.username || ''),
            external_account_id: igAccount.id,
            access_token: encryptedToken, // Same page token works for IG
            refresh_token: '',
            token_expires_at: tokenExpires,
            avatar_url: igAccount.profile_picture_url || '',
            is_active: true,
            metadata: { fb_page_id: page.id, ig_account_id: igAccount.id },
          }, { onConflict: 'user_id,platform,external_account_id' })

          connectedCount++
        }
      } catch (err: any) {
        console.error(`Failed to store page ${page.id}:`, err)
      }
    }

    const url = new URL('/social/accounts', origin)
    url.searchParams.set('success', `Connected ${connectedCount} account(s)`)
    return NextResponse.redirect(url)
  } catch (err: any) {
    console.error('Meta OAuth callback error:', err)
    const url = new URL('/social/accounts', origin)
    url.searchParams.set('error', err.message || 'OAuth flow failed')
    return NextResponse.redirect(url)
  }
}
