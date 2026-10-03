# Social Media Plugin — Setup Guide

The IndianPrograms social media manager is a comprehensive product that combines features from Buffer, Hootsuite, Publer, Loomly, Metricool, SocialPilot — and adds several industry-first features.

## Setup Steps

### 1. Run all migrations (in Supabase SQL Editor, in this order)

Run each file's contents in the Supabase SQL Editor:

1. `supabase-migration-social.sql` — base tables (social_accounts, scheduled_posts, post_runs)
2. `supabase-migration-social-v2.sql` — multi-image, content variations, AI generations, templates
3. `supabase-migration-social-v3.sql` — voice profiles, festivals (seeded), hashtag stats (seeded), analytics, approvals, evergreen, A/B tests, event countdowns
4. `supabase-migration-shortlinks.sql` — short links + click tracking

### 2. Create the post-images storage bucket

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

CREATE POLICY "Public post image access" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Auth users upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users update own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[2]);
CREATE POLICY "Users delete own post images" ON storage.objects FOR DELETE USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[2]);
```

### 3. Add environment variables to `.env.local`

```bash
# REQUIRED for AI features (text rewording, voice profiles, etc.)
ANTHROPIC_API_KEY=sk-ant-...

# REQUIRED for encrypting OAuth tokens
ENCRYPTION_KEY=your-32-byte-base64-key
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Run the scheduler

```bash
npx tsx scripts/social-scheduler/index.ts
```

The scheduler:
- Processes all due scheduled posts
- Mock-publishes them (logs the action, real platform integrations come later)
- Handles content/image variations (rotate/random strategies)
- Recycles evergreen posts after their cooldown
- Skips posts awaiting approval

For production, run it on a cron schedule (every 5 minutes is recommended).

## Pages Built

| Route | Purpose |
|-------|---------|
| `/social` | Hub with stats and quick actions |
| `/social/compose` | Full post composer with AI, multi-image, scheduling, recurrence |
| `/social/queue` | List + calendar view of scheduled posts |
| `/social/accounts` | Connect/manage social accounts (encrypted tokens) |
| `/social/templates` | Reusable post templates |
| `/social/voice` | AI Content DNA — train AI on your brand voice |
| `/social/calendar` | Cultural Calendar with Indian festivals |
| `/social/countdown` | Event-tied countdown campaigns |
| `/social/hashtags` | Hashtag intelligence dashboard |
| `/social/best-times` | Best posting times per platform |
| `/social/image-studio` | Image editor with overlays, frames, filters |
| `/social/bulk` | Bulk CSV upload |
| `/social/evergreen` | Auto-recycling content queue |
| `/social/ab-tests` | A/B testing engine |
| `/social/approvals` | Multi-step approval workflows |
| `/social/analytics` | Performance dashboard |

## API Endpoints

All under `/api/social/`:

- `connect` — encrypted account connection
- `ai-reword` — generate text variations
- `ai-hashtags` — basic hashtag suggestions
- `ai-hashtags-smart` — context-aware hashtag suggestions
- `ai-improve` — improve a post
- `story-weave` — generate platform-native versions
- `voice-analyze` — train brand voice
- `festival-content` — generate festival-themed posts
- `countdown-content` — generate countdown campaign posts

## Industry-First Features

These differentiate IndianPrograms from Buffer/Hootsuite/Publer:

1. **Cultural Calendar** — Indian festivals built-in with auto-suggested posts
2. **Event-Tied Countdowns** — Tied to actual events in your platform
3. **AI Content DNA** — Persistent brand voice that all AI generations match
4. **Cross-Platform Story Weaver** — One input → 7 platform-native versions
5. **Multi-Variant Recurrence** — Daily posts that auto-rotate through 5 variations
6. **Image Magic Studio** — Built-in editor with festival templates
7. **Hashtag Intelligence** — Indian-specific trending hashtags by metro

## Phase 2 (Future)

Real platform integrations require OAuth setup with each platform:
- Meta (Facebook, Instagram, Threads) — requires business verification
- X / Twitter API — paid tier
- LinkedIn API — requires app approval
- TikTok API — requires app approval

The architecture is ready — just plug in real publisher functions in `scripts/social-scheduler/publishers.ts`.
