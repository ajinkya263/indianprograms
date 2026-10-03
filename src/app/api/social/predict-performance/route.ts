import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fallback: rule-based scoring without AI
    const body = await request.json()
    return NextResponse.json(ruleBasedScore(body))
  }

  const body = await request.json()
  const { content, hashtags = '', platforms = [], hasImage = false, scheduledFor = '', tone = '' } = body

  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  const prompt = `You are a social media expert analyzing a post for predicted engagement.

Post details:
- Content: """${content}"""
- Hashtags: ${hashtags || 'none'}
- Platforms: ${platforms.join(', ') || 'none'}
- Has image: ${hasImage}
- Scheduled for: ${scheduledFor || 'now'}
- Tone: ${tone || 'neutral'}

Analyze and return a JSON object:
{
  "score": <number 0-100>,
  "rating": "poor|fair|good|excellent",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific actionable improvement 1", "improvement 2"],
  "predicted_reach": "low|medium|high|viral",
  "best_platform": "<best platform from the list>",
  "summary": "1-sentence summary"
}

Consider:
- Hook strength (first 2 lines)
- Call-to-action presence
- Hashtag quality and quantity
- Image presence (boosts engagement 2-3x)
- Length appropriateness for platforms
- Emotional resonance
- Cultural relevance for Indian diaspora
- Time of day if scheduled

Return ONLY the JSON, no other text.`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(ruleBasedScore(body))
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch {
    return NextResponse.json(ruleBasedScore(body))
  }
}

function ruleBasedScore(body: any) {
  const { content = '', hashtags = '', hasImage = false, platforms = [] } = body
  let score = 50
  const strengths: string[] = []
  const improvements: string[] = []

  // Length checks
  const len = content.length
  if (len > 50 && len < 280) { score += 10; strengths.push('Good length for most platforms') }
  if (len > 280 && platforms.includes('twitter')) { score -= 5; improvements.push('Too long for Twitter (max 280)') }

  // Hashtags
  const hashtagCount = (hashtags.match(/#/g) || []).length
  if (hashtagCount >= 3 && hashtagCount <= 30) { score += 10; strengths.push(`Good hashtag count (${hashtagCount})`) }
  if (hashtagCount === 0) { score -= 10; improvements.push('Add 3-10 relevant hashtags') }

  // Image
  if (hasImage) { score += 15; strengths.push('Has image (2-3x engagement boost)') }
  else { improvements.push('Add an image — posts with images get 2-3x more engagement') }

  // CTA detection
  if (/join us|sign up|register|book now|tickets|click|share|tag|comment/i.test(content)) {
    score += 5
    strengths.push('Has call-to-action')
  } else {
    improvements.push('Add a call-to-action (Join us, Book tickets, etc.)')
  }

  // Emoji approximation (basic surrogate detection)
  const emojiCount = (content.match(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g) || []).length
  if (emojiCount >= 1 && emojiCount <= 5) { score += 5; strengths.push('Good emoji use') }

  score = Math.max(0, Math.min(100, score))
  const rating = score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : 'poor'

  return {
    score,
    rating,
    strengths,
    improvements,
    predicted_reach: score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low',
    best_platform: platforms[0] || 'facebook',
    summary: `${rating.charAt(0).toUpperCase() + rating.slice(1)} post with ${score}/100 engagement potential`,
  }
}
