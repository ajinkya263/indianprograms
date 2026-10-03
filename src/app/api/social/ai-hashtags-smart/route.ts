import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI feature is not configured. ANTHROPIC_API_KEY is missing.' },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { text, metro, category } = body as {
    text?: string
    metro?: string
    category?: string
  }

  if (!text || text.trim().length < 5) {
    return NextResponse.json({ error: 'Text is required (min 5 chars)' }, { status: 400 })
  }

  // Query hashtag_stats for high performers matching metro/category
  let query = supabase
    .from('hashtag_stats')
    .select('hashtag, category, metro, effectiveness_score, is_trending, usage_count')
    .eq('is_banned', false)
    .order('effectiveness_score', { ascending: false })
    .limit(60)

  if (metro) query = query.or(`metro.eq.${metro},metro.eq.`)
  if (category) query = query.or(`category.eq.${category},category.eq.`)

  const { data: dbTags } = await query

  const dbHashtagsList =
    (dbTags || [])
      .map(
        (t: any) =>
          `${t.hashtag} (score=${t.effectiveness_score}, cat=${t.category || '-'}, metro=${
            t.metro || '-'
          }${t.is_trending ? ', trending' : ''})`
      )
      .join('\n') || '(none)'

  const prompt = `You are a hashtag strategist for an Indian cultural events platform.

Based on this text, suggest the best 10-15 hashtags from the provided list, plus 2-3 new ones if relevant. Focus on hashtags that match the event's specific theme, location, and audience.

Text: "${text}"
Metro: ${metro || 'any'}
Category: ${category || 'any'}

High-performing hashtags in the database (use these when relevant):
${dbHashtagsList}

Return ONLY a JSON object:
{
  "hashtags": ["#tag1", "#tag2", ...],
  "reasoning": "1-sentence explanation of why these were chosen"
}`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response could not be parsed' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { hashtags: string[]; reasoning: string }
    const hashtags = (parsed.hashtags || []).map((h) =>
      h.startsWith('#') ? h : `#${h.replace(/\s+/g, '')}`
    )
    const reasoning = parsed.reasoning || ''

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: 'hashtags_smart',
      input_text: text.substring(0, 1000),
      output_data: { hashtags, reasoning, metro, category },
      variation_count: hashtags.length,
    })

    return NextResponse.json({ hashtags, reasoning })
  } catch (err: any) {
    console.error('AI smart hashtags error:', err)
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
