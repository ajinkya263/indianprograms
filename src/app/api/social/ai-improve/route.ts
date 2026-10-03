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

  const body = await request.json()
  const { text, platform = '' } = body

  if (!text || text.trim().length < 5) {
    return NextResponse.json({ error: 'Text is required (min 5 chars)' }, { status: 400 })
  }

  const platformContext = platform ? `The post is for ${platform}.` : ''

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('voice_summary')
    .eq('user_id', user.id)
    .maybeSingle()
  const voiceInstruction = voiceProfile?.voice_summary
    ? `\nMatch this brand voice: ${voiceProfile.voice_summary}\n`
    : ''

  const prompt = `You are an expert social media coach for IndianPrograms.com, a platform for Indian cultural events in America.
${voiceInstruction}
Review the following social media post and suggest an improved version along with 3 specific, actionable tips to make it stronger. ${platformContext}

Original post:
"""
${text}
"""

Return ONLY a JSON object with this exact shape, no other text:
{
  "improved": "the improved post text",
  "tips": ["tip 1", "tip 2", "tip 3"]
}`

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

    const result: { improved: string; tips: string[] } = JSON.parse(jsonMatch[0])

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: 'improve',
      input_text: text.substring(0, 1000),
      output_data: result,
      variation_count: 1,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('AI improve error:', err)
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
