/**
 * Meta Graph API client (Facebook + Instagram).
 *
 * Used for:
 * - OAuth code → access token exchange
 * - Fetching user's Facebook Pages
 * - Fetching linked Instagram Business accounts
 * - Publishing posts to Facebook Pages
 * - Publishing posts to Instagram (2-step container/publish flow)
 *
 * Permissions required (granted at OAuth time):
 * - pages_show_list
 * - pages_read_engagement
 * - pages_manage_posts
 * - instagram_basic
 * - instagram_content_publish
 * - business_management
 *
 * Until Meta App Review is approved, only the developer + test users can grant these.
 */

const GRAPH_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`
const FB_OAUTH_BASE = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`

export const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
].join(',')

export interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
  picture?: { data: { url: string } }
  instagram_business_account?: { id: string }
}

export interface InstagramAccount {
  id: string
  username: string
  profile_picture_url: string
}

export interface PublishResult {
  success: boolean
  external_post_id: string
  external_url: string
  error?: string
}

/**
 * Generate the OAuth URL where the user grants permissions.
 */
export function getMetaOAuthUrl(redirectUri: string, state: string): string {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error('META_APP_ID env var not set')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_SCOPES,
    response_type: 'code',
  })
  return `${FB_OAUTH_BASE}?${params.toString()}`
}

/**
 * Exchange an OAuth code for a short-lived user access token.
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; expires_in: number }> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID and META_APP_SECRET env vars required')

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })

  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }
  return response.json()
}

/**
 * Convert a short-lived user token (~1 hour) into a long-lived one (~60 days).
 */
export async function getLongLivedUserToken(shortLivedToken: string): Promise<{ access_token: string; expires_in: number }> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID and META_APP_SECRET env vars required')

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  })

  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params.toString()}`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Long-lived token exchange failed: ${error}`)
  }
  return response.json()
}

/**
 * Fetch all Facebook Pages the user manages, including their per-page access tokens.
 * Page tokens from a long-lived user token never expire (with normal use).
 */
export async function getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
  const url = `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,category,picture,instagram_business_account&access_token=${userAccessToken}`
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Get pages failed: ${error}`)
  }
  const data = await response.json()
  return data.data || []
}

/**
 * Fetch the Instagram Business account linked to a Facebook Page.
 */
export async function getInstagramAccount(pageId: string, pageAccessToken: string): Promise<InstagramAccount | null> {
  const url = `${GRAPH_BASE}/${pageId}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${pageAccessToken}`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  if (!data.instagram_business_account) return null
  return data.instagram_business_account
}

/**
 * Publish a text post to a Facebook Page.
 */
export async function publishToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
  link?: string,
): Promise<PublishResult> {
  try {
    const params = new URLSearchParams({
      message,
      access_token: pageAccessToken,
    })
    if (link) params.set('link', link)

    const response = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
      method: 'POST',
      body: params,
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, external_post_id: '', external_url: '', error }
    }

    const data = await response.json()
    const postId = data.id || ''
    return {
      success: true,
      external_post_id: postId,
      external_url: `https://facebook.com/${postId}`,
    }
  } catch (err: any) {
    return { success: false, external_post_id: '', external_url: '', error: err.message }
  }
}

/**
 * Publish a photo post to a Facebook Page.
 */
export async function publishPhotoToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string,
): Promise<PublishResult> {
  try {
    const params = new URLSearchParams({
      url: imageUrl,
      caption,
      access_token: pageAccessToken,
    })

    const response = await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
      method: 'POST',
      body: params,
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, external_post_id: '', external_url: '', error }
    }

    const data = await response.json()
    const postId = data.post_id || data.id || ''
    return {
      success: true,
      external_post_id: postId,
      external_url: `https://facebook.com/${postId}`,
    }
  } catch (err: any) {
    return { success: false, external_post_id: '', external_url: '', error: err.message }
  }
}

/**
 * Publish to Instagram. This requires a 2-step process:
 * 1. Create a media container (with image URL)
 * 2. Publish the container
 */
export async function publishToInstagram(
  igAccountId: string,
  pageAccessToken: string,
  imageUrl: string,
  caption: string,
): Promise<PublishResult> {
  try {
    if (!imageUrl) {
      return {
        success: false,
        external_post_id: '',
        external_url: '',
        error: 'Instagram requires an image. Add an image to your post.',
      }
    }

    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageAccessToken,
    })

    const containerResponse = await fetch(`${GRAPH_BASE}/${igAccountId}/media`, {
      method: 'POST',
      body: containerParams,
    })

    if (!containerResponse.ok) {
      const error = await containerResponse.text()
      return { success: false, external_post_id: '', external_url: '', error }
    }

    const containerData = await containerResponse.json()
    const containerId = containerData.id

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: pageAccessToken,
    })

    const publishResponse = await fetch(`${GRAPH_BASE}/${igAccountId}/media_publish`, {
      method: 'POST',
      body: publishParams,
    })

    if (!publishResponse.ok) {
      const error = await publishResponse.text()
      return { success: false, external_post_id: '', external_url: '', error }
    }

    const publishData = await publishResponse.json()
    const postId = publishData.id || ''
    return {
      success: true,
      external_post_id: postId,
      external_url: `https://www.instagram.com/p/${postId}`,
    }
  } catch (err: any) {
    return { success: false, external_post_id: '', external_url: '', error: err.message }
  }
}
