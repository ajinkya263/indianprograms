import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI feature is not configured. ANTHROPIC_API_KEY is missing.' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { brand_name, brand_description, sample_posts } = body as {
    brand_name?: string
    brand_description?: string
    sample_posts?: string[]
  }

  // Upsert incoming fields first if provided
  if (brand_name !== undefined || brand_description !== undefined || sample_posts !== undefined) {
    const payload: Record<string, any> = { user_id: user.id }
    if (brand_name !== undefined) payload.brand_name = brand_name
    if (brand_description !== undefined) payload.brand_description = brand_description
    if (sample_posts !== undefined) payload.sample_posts = sample_posts
    const { error: upsertErr } = await supabase
      .from('voice_profiles')
      .upsert(payload, { onConflict: 'user_id' })
    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }
  }

  const { data: profile, error: fetchErr } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !profile) {
    return NextResponse.json({ error: 'Voice profile not found. Add samples first.' }, { status: 404 })
  }

  const posts: string[] = profile.sample_posts || []
  if (posts.length < 3) {
    return NextResponse.json({ error: 'At least 3 sample posts are required.' }, { status: 400 })
  }

  const postsBlock = posts.map((p, i) => `Post ${i + 1}:\n"""\n${p}\n"""`).join('\n\n')

  const prompt = `You are analyzing a brand's social media voice. Below are sample posts from this brand. Analyze them and return a JSON object with these fields:

{
  "detected_tone": "primary tone (e.g., friendly, professional, playful, inspirational)",
  "detected_style": "writing style description (e.g., short punchy sentences, long detailed posts, story-driven)",
  "vocabulary_keywords": ["array", "of", "frequent", "distinctive", "words"],
  "emoji_usage": "description of emoji habits (none, minimal, frequent, specific themes)",
  "hashtag_style": "how they use hashtags (none, few, many, specific themes)",
  "voice_summary": "2-3 sentence summary of this brand's unique voice that future posts should match"
}

Sample posts:
${postsBlock}

Return only the JSON, no other text.`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response could not be parsed' }, { status: 500 })
    }

    const analysis = JSON.parse(jsonMatch[0]) as {
      detected_tone: string
      detected_style: string
      vocabulary_keywords: string[]
      emoji_usage: string
      hashtag_style: string
      voice_summary: string
    }

    const { data: updated, error: updateErr } = await supabase
      .from('voice_profiles')
      .update({
        detected_tone: analysis.detected_tone,
        detected_style: analysis.detected_style,
        vocabulary_keywords: analysis.vocabulary_keywords,
        emoji_usage: analysis.emoji_usage,
        hashtag_style: analysis.hashtag_style,
        voice_summary: analysis.voice_summary,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ profile: updated, analysis })
  } catch (err: any) {
    console.error('Voice analyze error:', err)
    return NextResponse.json({ error: err.message || 'AI analysis failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('voice_profiles').delete().eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile: data || null })
}
