import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured' }, { status: 503 })

  const body = await request.json()
  const { topic, count = 10 } = body
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 })

  const prompt = `Generate ${count} creative social media post ideas for an Indian cultural events platform.

Topic/theme: ${topic}

Each idea should be:
- A complete post concept (1-2 sentences describing what to post)
- Specific and actionable (not generic)
- Culturally relevant to the Indian diaspora in America
- Varied in angle (story, tip, behind-the-scenes, question, fact, celebration, etc.)
- Engaging and shareable

Return ONLY a JSON array of strings, no other text:
["idea 1", "idea 2", ...]`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response could not be parsed' }, { status: 500 })
    }

    const ideas: string[] = JSON.parse(jsonMatch[0])
    return NextResponse.json({ ideas })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
