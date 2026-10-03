import { NextResponse, type NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI is not configured.' }, { status: 503 })
  }

  const body = await request.json()
  const { eventId, countdownDays } = body

  if (!eventId || !Array.isArray(countdownDays)) {
    return NextResponse.json({ error: 'eventId and countdownDays required' }, { status: 400 })
  }

  // Fetch event
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const daysList = countdownDays.map((d: number) =>
    d === 0 ? 'day of event' : d > 0 ? `${d} days before` : `${Math.abs(d)} days after (recap)`
  ).join(', ')

  const prompt = `Generate countdown social media posts for an Indian cultural event.

Event:
- Title: ${event.title}
- Date: ${event.date}
- Time: ${event.time || 'TBA'}
- Venue: ${event.venue}
- City: ${event.city}, ${event.state}
- Description: ${event.description || ''}

Generate one post for each of these timepoints: ${daysList}

Numbered: 0 = day of, positive = days before, negative = days after
Tone escalation:
- 30+ days: "Save the date" excitement
- 14 days: building anticipation
- 7 days: "One week to go!"
- 3 days: urgency, "almost here"
- 1 day: "TOMORROW"
- 0 days: "TONIGHT" / "TODAY"
- negative: "Thank you / what a night"

Each post 200-400 chars, relevant emoji, mention venue and city.

Return ONLY a JSON array:
[{"daysOut": 30, "content": "..."}, ...]`

  try {
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response could not be parsed' }, { status: 500 })
    }

    const posts = JSON.parse(jsonMatch[0])
    return NextResponse.json({ posts, event })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
