import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const PLATFORM_SPECS: Record<string, string> = {
  twitter:
    '- twitter: Max 280 chars. Punchy hook, single key idea, optional hashtags. Encourage retweets.',
  facebook:
    '- facebook: Conversational, longer (300-1000 chars), invites engagement, story-driven, can include link previews.',
  instagram:
    '- instagram: Visual-first thinking, longer caption (200-2000 chars), line breaks for readability, hashtags at the end (10-30 hashtags), emojis for mood.',
  linkedin:
    '- linkedin: Professional, business-value focused, longer (300-2000 chars), bullet points, thought leadership angle.',
  threads:
    '- threads: Conversational, 200-500 chars, encourages replies, casual tone.',
  tiktok:
    '- tiktok: Hook-first script (200-2200 chars), describes video content, includes trending audio suggestion.',
  youtube:
    '- youtube: Detailed description (300-5000 chars), SEO-friendly, includes timestamps if video.',
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI feature is not configured. ANTHROPIC_API_KEY is missing.' },
      { status: 503 }
    )
  }

  const body = await request.json()
  const { content, platforms } = body as {
    content?: string
    platforms?: string[]
  }

  if (!content || content.trim().length < 5) {
    return NextResponse.json(
      { error: 'Content is required (min 5 chars)' },
      { status: 400 }
    )
  }
  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json(
      { error: 'At least one platform is required' },
      { status: 400 }
    )
  }

  const requested = platforms.filter((p) => PLATFORM_SPECS[p])
  if (requested.length === 0) {
    return NextResponse.json(
      { error: 'No supported platforms requested' },
      { status: 400 }
    )
  }

  const specs = requested.map((p) => PLATFORM_SPECS[p]).join('\n')
  const jsonShape =
    '{\n' +
    requested.map((p) => `  "${p}": "..."`).join(',\n') +
    '\n}'

  const prompt = `You are an expert social media copywriter for IndianPrograms.com — an Indian cultural events platform in America.

Take the following content and create platform-optimized versions for each requested platform. Each version should:
- Match the platform's native style and best practices
- Stay within character limits
- Use platform-appropriate formatting
- Be engaging and authentic to the platform's audience

Content:
"""
${content}
"""

Platform requirements:
${specs}

Return ONLY a JSON object with platform keys, no other text:
${jsonShape}`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AI response could not be parsed' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>
    const versions: Record<string, string> = {}
    for (const p of requested) {
      if (typeof parsed[p] === 'string') versions[p] = parsed[p]
    }

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: 'story_weave',
      input_text: content.substring(0, 1000),
      output_data: versions,
      variation_count: Object.keys(versions).length,
    })

    return NextResponse.json({ versions })
  } catch (err: any) {
    console.error('Story weave error:', err)
    return NextResponse.json(
      { error: err.message || 'AI generation failed' },
      { status: 500 }
    )
  }
}
