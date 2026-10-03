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

  const body = await request.json()
  const { festivalId, festivalName } = body as {
    festivalId?: string
    festivalName?: string
  }

  if (!festivalId && !festivalName) {
    return NextResponse.json(
      { error: 'festivalId or festivalName is required' },
      { status: 400 }
    )
  }

  let query = supabase.from('festivals').select('*')
  if (festivalId) query = query.eq('id', festivalId)
  else if (festivalName) query = query.ilike('name', festivalName)

  const { data: festival, error: fErr } = await query.limit(1).single()
  if (fErr || !festival) {
    return NextResponse.json({ error: 'Festival not found' }, { status: 404 })
  }

  const f = festival as {
    id: string
    name: string
    date: string
    description: string | null
    default_greeting: string | null
    emoji: string | null
  }

  const prompt = `Generate 3 social media post variations for the upcoming Indian festival "${f.name}".

Festival info:
- Date: ${f.date}
- Description: ${f.description || ''}
- Traditional greeting: ${f.default_greeting || ''}

Each variation should:
- Be culturally authentic and respectful
- Include the greeting naturally
- Have a unique tone (one warm, one celebratory, one inspirational)
- Be 200-400 chars
- Include relevant hashtags
- Be suitable for an Indian cultural events platform in America

Return ONLY a JSON array:
[
  { "title": "...", "content": "...", "hashtags": "#diwali #..." },
  ...
]`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AI response could not be parsed' },
        { status: 500 }
      )
    }

    const posts: { title: string; content: string; hashtags: string }[] =
      JSON.parse(jsonMatch[0])

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: 'festival',
      input_text: f.name,
      output_data: { posts },
      variation_count: posts.length,
    })

    return NextResponse.json({ posts, festival: f })
  } catch (err: any) {
    console.error('Festival content error:', err)
    return NextResponse.json(
      { error: err.message || 'AI generation failed' },
      { status: 500 }
    )
  }
}
