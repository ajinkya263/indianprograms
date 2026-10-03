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
  const { text, count = 12 } = body

  if (!text || text.trim().length < 5) {
    return NextResponse.json({ error: 'Text is required (min 5 chars)' }, { status: 400 })
  }

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('voice_summary, hashtag_style')
    .eq('user_id', user.id)
    .maybeSingle()
  const voiceInstruction = voiceProfile?.voice_summary
    ? `\nMatch this brand voice: ${voiceProfile.voice_summary}${voiceProfile.hashtag_style ? ` Hashtag style: ${voiceProfile.hashtag_style}.` : ''}\n`
    : ''

  const prompt = `You are a social media hashtag expert for IndianPrograms.com, a platform for Indian cultural events in America.
${voiceInstruction}
Generate ${count} relevant, high-performing hashtags for the following post. Mix popular and niche tags. Include tags relevant to Indian culture, diaspora, and the specific topic. Each hashtag must start with #, no spaces within a tag.

Post:
"""
${text}
"""

Return ONLY a JSON array of hashtag strings, no other text. Example:
["#bollywood", "#desievents", "#indianamerican"]`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response could not be parsed' }, { status: 500 })
    }

    const hashtags: string[] = JSON.parse(jsonMatch[0])

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: 'hashtags',
      input_text: text.substring(0, 1000),
      output_data: { hashtags },
      variation_count: hashtags.length,
    })

    return NextResponse.json({ hashtags })
  } catch (err: any) {
    console.error('AI hashtags error:', err)
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
