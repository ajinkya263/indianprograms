import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

/**
 * POST /api/social/connect
 *
 * Server-side endpoint for connecting a social account.
 * Encrypts access_token and refresh_token before storing.
 *
 * Body: {
 *   platform: string,
 *   account_name: string,
 *   account_handle: string,
 *   external_account_id: string,
 *   access_token: string,
 *   refresh_token?: string,
 *   token_expires_at?: string,
 *   avatar_url?: string,
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    platform,
    account_name,
    account_handle = '',
    external_account_id = '',
    access_token = '',
    refresh_token = '',
    token_expires_at = null,
    avatar_url = '',
  } = body

  if (!platform || !account_name) {
    return NextResponse.json({ error: 'platform and account_name are required' }, { status: 400 })
  }

  // Encrypt sensitive fields server-side
  let encryptedAccess: string
  let encryptedRefresh: string
  try {
    encryptedAccess = encrypt(access_token)
    encryptedRefresh = encrypt(refresh_token)
  } catch (err) {
    console.error('Encryption failed:', err)
    return NextResponse.json({ error: 'Encryption configuration error. Check ENCRYPTION_KEY env var.' }, { status: 500 })
  }

  // Insert with encrypted tokens
  const { data, error } = await supabase
    .from('social_accounts')
    .insert({
      user_id: user.id,
      platform,
      account_name,
      account_handle,
      external_account_id,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at,
      avatar_url,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return account info WITHOUT the tokens
  return NextResponse.json({
    id: data.id,
    platform: data.platform,
    account_name: data.account_name,
    account_handle: data.account_handle,
    is_active: data.is_active,
    connected_at: data.connected_at,
    avatar_url: data.avatar_url,
  })
}

/**
 * DELETE /api/social/connect?id=xxx
 * Disconnects a social account.
 */
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Extra safety

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
