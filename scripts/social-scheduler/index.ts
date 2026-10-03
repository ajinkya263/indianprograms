// Social scheduler worker.
//
// Runs once per invocation. Finds scheduled_posts due (next_run_at <= now,
// status = 'scheduled'), "publishes" each to its target platforms via mock
// publisher functions, records a row in post_runs, and advances or completes
// the scheduled post based on its recurrence settings.
//
// Real platform integrations (Facebook Graph, X API v2, LinkedIn, etc.) will
// replace the mock publishers in scripts/social-scheduler/publishers.ts.
//
// Usage: npx tsx scripts/social-scheduler/index.ts

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import type { ScheduledPost } from '../../src/lib/social-types'
import { publishToPlatform } from './publishers'
import { calculateNextRun } from './recurrence'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[social-scheduler] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

type VariationSelection = {
  content: string
  imageUrl: string | null
  imageUrls: string[]
  variationIndex: number
  imageIndex: number
  contentStrategy: string
  imageStrategy: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectVariation(post: any): VariationSelection {
  const totalRuns: number = post.total_runs || 0
  const contentStrategy: string = post.content_strategy || 'fixed'
  const imageStrategy: string = post.image_strategy || 'first'

  const contentVariations: string[] = Array.isArray(post.content_variations)
    ? post.content_variations.filter((c: unknown): c is string => typeof c === 'string' && c.length > 0)
    : []

  let content: string = post.content || ''
  let variationIndex = -1

  if (contentVariations.length > 0 && contentStrategy !== 'fixed') {
    if (contentStrategy === 'rotate') {
      variationIndex = totalRuns % contentVariations.length
      content = contentVariations[variationIndex]
    } else if (contentStrategy === 'random') {
      variationIndex = Math.floor(Math.random() * contentVariations.length)
      content = contentVariations[variationIndex]
    }
  }

  const rawImages: string[] = Array.isArray(post.image_urls)
    ? post.image_urls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0)
    : []
  const imagePool: string[] = rawImages.length > 0
    ? rawImages
    : post.image_url ? [post.image_url] : []

  let imageUrl: string | null = null
  let imageUrls: string[] = []
  let imageIndex = -1

  if (imagePool.length === 0) {
    imageUrl = null
    imageUrls = []
  } else if (imageStrategy === 'collage') {
    imageUrls = imagePool
    imageUrl = imagePool[0]
    imageIndex = -1
  } else if (imagePool.length === 1 || imageStrategy === 'first') {
    imageUrl = imagePool[0]
    imageUrls = [imagePool[0]]
    imageIndex = 0
  } else if (imageStrategy === 'rotate') {
    imageIndex = totalRuns % imagePool.length
    imageUrl = imagePool[imageIndex]
    imageUrls = [imageUrl]
  } else if (imageStrategy === 'random') {
    imageIndex = Math.floor(Math.random() * imagePool.length)
    imageUrl = imagePool[imageIndex]
    imageUrls = [imageUrl]
  } else {
    imageUrl = imagePool[0]
    imageUrls = [imagePool[0]]
    imageIndex = 0
  }

  return { content, imageUrl, imageUrls, variationIndex, imageIndex, contentStrategy, imageStrategy }
}

async function processPost(post: ScheduledPost): Promise<void> {
  console.log(`[social-scheduler] Processing post ${post.id} (${post.title || 'untitled'})`)

  const now = new Date()
  const platforms = post.platforms || []

  // Fetch user's connected accounts for these platforms
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', post.user_id)
    .eq('is_active', true)
    .in('platform', platforms)

  const accountsByPlatform = new Map<string, any>()
  for (const account of accounts || []) {
    if (!accountsByPlatform.has(account.platform)) {
      accountsByPlatform.set(account.platform, account)
    }
  }

  const variation = selectVariation(post)
  console.log(
    `[social-scheduler] Variation: content[${variation.variationIndex}] via ${variation.contentStrategy}, image[${variation.imageIndex}] via ${variation.imageStrategy}`
  )

  // Build a post snapshot with the resolved variation for the publisher
  const resolvedPost = {
    ...post,
    content: variation.content,
    image_url: variation.imageUrl,
    image_urls: variation.imageUrls,
  } as ScheduledPost

  for (const platform of platforms) {
    const account = accountsByPlatform.get(platform) || null
    const result = await publishToPlatform(platform, resolvedPost, account)

    const responseData = {
      ...(result.response_data || {}),
      variation: {
        content_index: variation.variationIndex,
        content_strategy: variation.contentStrategy,
        content_used: variation.content,
        image_index: variation.imageIndex,
        image_strategy: variation.imageStrategy,
        image_url_used: variation.imageUrl,
        image_urls_used: variation.imageUrls,
      },
    }

    // Determine status based on result and whether this is a real or mock platform
    const isMock = ['twitter', 'threads', 'linkedin', 'tiktok', 'youtube'].includes(platform)
    const runStatus = isMock ? 'mock' : (result.success ? 'success' : 'failed')

    const { error: runErr } = await supabase.from('post_runs').insert({
      scheduled_post_id: post.id,
      user_id: post.user_id,
      platform,
      attempted_at: now.toISOString(),
      status: runStatus,
      external_post_id: result.external_post_id,
      external_url: result.external_url,
      error_message: result.error_message || '',
      response_data: responseData,
    })

    if (runErr) {
      console.error(`[social-scheduler] Failed to insert post_run for ${post.id}/${platform}:`, runErr.message)
    }
  }

  // Compute next state
  const newTotalRuns = (post.total_runs || 0) + 1
  let nextRunAt: string | null = null
  let status: ScheduledPost['status'] = post.status

  if (post.schedule_type === 'recurring') {
    const next = calculateNextRun(post, now)
    if (next) {
      nextRunAt = next.toISOString()
    } else {
      status = 'completed'
    }
  } else {
    // one-time ('now' or 'once')
    status = 'completed'
  }

  const { error: updErr } = await supabase
    .from('scheduled_posts')
    .update({
      last_run_at: now.toISOString(),
      total_runs: newTotalRuns,
      next_run_at: nextRunAt,
      status,
      updated_at: now.toISOString(),
    })
    .eq('id', post.id)

  if (updErr) {
    console.error(`[social-scheduler] Failed to update scheduled_post ${post.id}:`, updErr.message)
  } else {
    console.log(`[social-scheduler] Post ${post.id} -> status=${status}, next_run_at=${nextRunAt || 'none'}`)
  }
}

async function main(): Promise<void> {
  const startedAt = new Date()
  console.log(`[social-scheduler] Started at ${startedAt.toISOString()}`)

  const { data: duePosts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('next_run_at', startedAt.toISOString())

  if (error) {
    console.error('[social-scheduler] Query failed:', error.message)
    process.exit(1)
  }

  const allPosts = (duePosts || []) as any[]

  // Filter out posts that are pending approval or rejected
  const posts = allPosts.filter((p: any) => {
    const approvalStatus = p.approval_status
    return !approvalStatus || approvalStatus === 'approved'
  })

  const skipped = allPosts.length - posts.length
  if (skipped > 0) console.log(`[social-scheduler] Skipped ${skipped} post(s) awaiting approval`)
  console.log(`[social-scheduler] Found ${posts.length} due post(s)`)

  for (const post of posts) {
    try {
      await processPost(post as ScheduledPost)
    } catch (err) {
      console.error(`[social-scheduler] Error processing post ${post.id}:`, err)
    }
  }

  // Process evergreen content recycling
  await processEvergreenPosts(startedAt)

  console.log(`[social-scheduler] Done in ${Date.now() - startedAt.getTime()}ms`)
}

async function processEvergreenPosts(now: Date): Promise<void> {
  const { data: evergreenList } = await supabase
    .from('evergreen_posts')
    .select('*, scheduled_post:scheduled_posts(*)')
    .eq('is_active', true)

  if (!evergreenList || evergreenList.length === 0) return

  console.log(`[social-scheduler] Checking ${evergreenList.length} evergreen post(s)`)

  for (const e of evergreenList as any[]) {
    const last = e.last_recycled_at ? new Date(e.last_recycled_at) : null
    const original = e.scheduled_post
    if (!original) continue

    const originalCreated = new Date(original.created_at || now)
    const referenceDate = last || originalCreated
    const daysSince = (now.getTime() - referenceDate.getTime()) / (24 * 60 * 60 * 1000)

    if (daysSince >= e.recycle_after_days) {
      console.log(`[social-scheduler] Recycling evergreen post: ${original.title || original.id}`)

      // Create a fresh scheduled_post copy that publishes immediately
      const { error: insertErr } = await supabase.from('scheduled_posts').insert({
        user_id: original.user_id,
        title: `${original.title || 'Recycled'} (recycled #${(e.recycle_count || 0) + 1})`,
        content: original.content,
        image_url: original.image_url,
        image_urls: original.image_urls || [],
        link_url: original.link_url || '',
        hashtags: original.hashtags || '',
        platforms: original.platforms || [],
        schedule_type: 'now',
        next_run_at: now.toISOString(),
        status: 'scheduled',
      })

      if (insertErr) {
        console.error(`[social-scheduler] Failed to recycle:`, insertErr.message)
        continue
      }

      // Update evergreen tracking
      await supabase
        .from('evergreen_posts')
        .update({
          last_recycled_at: now.toISOString(),
          recycle_count: (e.recycle_count || 0) + 1,
        })
        .eq('id', e.id)
    }
  }
}

main().catch((err) => {
  console.error('[social-scheduler] Fatal error:', err)
  process.exit(1)
})
