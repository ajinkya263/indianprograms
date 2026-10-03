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
  const { text, tone = 'vibrant', count = 5, platform = '', hashtags = '', includeEmojis = true } = body

  if (!text || text.trim().length < 5) {
    return NextResponse.json({ error: 'Text is required (min 5 chars)' }, { status: 400 })
  }

  const toneInstructions: Record<string, string> = {
    vibrant: 'energetic, lively, and colorful with strong emotional appeal',
    young: 'casual, trendy, Gen-Z friendly with current slang and emojis',
    professional: 'polished, business-appropriate, and authoritative',
    casual: 'friendly, conversational, and approachable',
    inspirational: 'motivating, uplifting, and meaningful',
    humorous: 'witty, playful, and entertaining',
    elegant: 'sophisticated, refined, and graceful',
    cultural: 'celebrates Indian culture, traditions, and heritage',
    festive: 'celebratory, joyful, with festival spirit',
    urgent: 'time-sensitive, action-driven, FOMO-inducing',
  }

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('voice_summary')
    .eq('user_id', user.id)
    .maybeSingle()
  const voiceInstruction = voiceProfile?.voice_summary
    ? `\nMatch this brand voice: ${voiceProfile.voice_summary}`
    : ''

  const toneDesc = toneInstructions[tone] || toneInstructions.vibrant
  const platformContext = platform ? `Optimized for ${platform}.` : 'Suitable for any social platform.'
  const emojiInstruction = includeEmojis ? 'Use relevant emojis sparingly to add visual appeal.' : 'Do not use emojis.'

  const prompt = `You are an expert social media copywriter for an Indian cultural events platform called IndianPrograms.com.

Generate ${count} different variations of the following social media post. Each variation should:
- Have a ${toneDesc} tone
- ${platformContext}
- ${emojiInstruction}
- Preserve the core message and any specific details (dates, names, places)
- Be unique in wording, structure, and approach
- Feel fresh and engaging
- Be suitable for the Indian diaspora audience in America

${hashtags ? `Use these hashtags at the end: ${hashtags}` : ''}

Original post:
"""
${text}
"""

${voiceInstruction}

Return ONLY a JSON array of strings, no other text. Example format:
["variation 1 text", "variation 2 text", "variation 3 text"]`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response could not be parsed' }, { status: 500 })
    }

    const variations: string[] = JSON.parse(jsonMatch[0])

    await supabase.from('ai_generations').insert({
      user_id: user.id,
      generation_type: 'reword',
      input_text: text.substring(0, 1000),
      output_data: { variations },
      tone,
      variation_count: variations.length,
    })

    return NextResponse.json({ variations })
  } catch (err: any) {
    console.error('AI reword error:', err)
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
