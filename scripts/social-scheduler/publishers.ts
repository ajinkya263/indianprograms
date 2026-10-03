// Publisher functions per platform.
// Facebook + Instagram are now real (Meta Graph API).
// Other platforms are still mocked until OAuth + APIs are added.

import type { ScheduledPost } from '../../src/lib/social-types'
import {
  publishToFacebookPage,
  publishPhotoToFacebookPage,
  publishToInstagram as publishToIG,
} from '../../src/lib/meta-api'
import { decrypt } from '../../src/lib/crypto'

export interface SocialAccountRow {
  id: string
  user_id: string
  platform: string
  account_name: string
  external_account_id: string
  access_token: string // encrypted
  refresh_token: string // encrypted
  token_expires_at: string | null
  metadata: Record<string, any>
}

export interface PublishResult {
  success: boolean
  external_post_id: string
  external_url: string
  error_message?: string
  response_data: Record<string, unknown>
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 12)
}

function mockPublish(platform: string, post: ScheduledPost): PublishResult {
  const snippet = (post.content || post.title || '').slice(0, 60)
  console.log(`[social-scheduler] Mock publishing to ${platform}: "${snippet}..."`)
  const id = randomId()
  return {
    success: true,
    external_post_id: id,
    external_url: `https://mock-platform.example/post/${id}`,
    response_data: { mock: true, platform, at: new Date().toISOString() },
  }
}

/**
 * Publish to Facebook Page using the user's connected page token.
 */
export async function publishToFacebook(post: ScheduledPost, account: SocialAccountRow | null): Promise<PublishResult> {
  if (!account) {
    return {
      success: false,
      external_post_id: '',
      external_url: '',
      error_message: 'No connected Facebook account found',
      response_data: {},
    }
  }

  try {
    const pageToken = decrypt(account.access_token)
    const pageId = account.external_account_id
    const message = post.content || ''
    const imageUrl = post.image_url || ''
    const linkUrl = post.link_url || ''

    let result
    if (imageUrl) {
      result = await publishPhotoToFacebookPage(pageId, pageToken, imageUrl, message)
    } else {
      result = await publishToFacebookPage(pageId, pageToken, message, linkUrl || undefined)
    }

    console.log(`[social-scheduler] Facebook → ${result.success ? '✓' : '✗'} ${account.account_name}`)

    return {
      success: result.success,
      external_post_id: result.external_post_id,
      external_url: result.external_url,
      error_message: result.error,
      response_data: { platform: 'facebook', page_id: pageId, page_name: account.account_name },
    }
  } catch (err: any) {
    console.error(`[social-scheduler] Facebook publish error:`, err.message)
    return {
      success: false,
      external_post_id: '',
      external_url: '',
      error_message: err.message,
      response_data: {},
    }
  }
}

/**
 * Publish to Instagram using the linked Facebook Page token.
 */
export async function publishToInstagram(post: ScheduledPost, account: SocialAccountRow | null): Promise<PublishResult> {
  if (!account) {
    return {
      success: false,
      external_post_id: '',
      external_url: '',
      error_message: 'No connected Instagram account found',
      response_data: {},
    }
  }

  if (!post.image_url) {
    return {
      success: false,
      external_post_id: '',
      external_url: '',
      error_message: 'Instagram requires an image. Add an image to your post.',
      response_data: {},
    }
  }

  try {
    const pageToken = decrypt(account.access_token)
    const igAccountId = account.external_account_id
    const caption = post.content || ''

    const result = await publishToIG(igAccountId, pageToken, post.image_url, caption)

    console.log(`[social-scheduler] Instagram → ${result.success ? '✓' : '✗'} ${account.account_name}`)

    return {
      success: result.success,
      external_post_id: result.external_post_id,
      external_url: result.external_url,
      error_message: result.error,
      response_data: { platform: 'instagram', ig_account_id: igAccountId, account_name: account.account_name },
    }
  } catch (err: any) {
    console.error(`[social-scheduler] Instagram publish error:`, err.message)
    return {
      success: false,
      external_post_id: '',
      external_url: '',
      error_message: err.message,
      response_data: {},
    }
  }
}

export function publishToTwitter(post: ScheduledPost): PublishResult {
  return mockPublish('twitter', post)
}

export function publishToThreads(post: ScheduledPost): PublishResult {
  return mockPublish('threads', post)
}

export function publishToLinkedIn(post: ScheduledPost): PublishResult {
  return mockPublish('linkedin', post)
}

export function publishToTikTok(post: ScheduledPost): PublishResult {
  return mockPublish('tiktok', post)
}

export function publishToYouTube(post: ScheduledPost): PublishResult {
  return mockPublish('youtube', post)
}

/**
 * Dispatcher: routes to the right publisher based on platform.
 * Async because real publishers (Facebook, Instagram) are async.
 */
export async function publishToPlatform(
  platform: string,
  post: ScheduledPost,
  account: SocialAccountRow | null,
): Promise<PublishResult> {
  switch (platform) {
    case 'facebook':
      return publishToFacebook(post, account)
    case 'instagram':
      return publishToInstagram(post, account)
    case 'twitter':
      return publishToTwitter(post)
    case 'threads':
      return publishToThreads(post)
    case 'linkedin':
      return publishToLinkedIn(post)
    case 'tiktok':
      return publishToTikTok(post)
    case 'youtube':
      return publishToYouTube(post)
    default:
      return {
        success: false,
        external_post_id: '',
        external_url: '',
        error_message: `Unknown platform: ${platform}`,
        response_data: {},
      }
  }
}
