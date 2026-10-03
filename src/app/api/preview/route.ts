import { NextResponse } from 'next/server'

/**
 * Fetch a URL's Open Graph metadata for admin hover previews.
 *
 * Called by the LinkPreview client component whenever the admin hovers
 * over a ticket link. Server-side fetch avoids CORS, and og-tag parsing
 * is done with lightweight regex so we don't drag cheerio into the API
 * route bundle.
 *
 * Whitelisted to http(s) to prevent SSRF against file:// / localhost.
 * Cached edge-side for an hour so quick re-hovers are instant.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Preview {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

function extractMeta(html: string, property: string): string {
  // Match either <meta property="og:X" content="..."> or the reverse attr order.
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property.replace(/^og:/, '')}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1].trim()
  }
  return ''
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('url')
  if (!raw) return NextResponse.json({ error: 'missing url param' }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch { return NextResponse.json({ error: 'invalid url' }, { status: 400 }) }
  if (!['http:', 'https:'].includes(target.protocol)) {
    return NextResponse.json({ error: 'protocol not allowed' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)
    const resp = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Some sites 403 headless requests. A browser-like UA gets around most.
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    clearTimeout(timeout)

    if (!resp.ok) {
      return NextResponse.json({ error: `upstream ${resp.status}`, status: resp.status }, { status: 502 })
    }

    // Guard against enormous pages — take first 400KB which is plenty for the head.
    const buf = await resp.arrayBuffer()
    const slice = buf.byteLength > 400_000 ? buf.slice(0, 400_000) : buf
    const html = new TextDecoder('utf-8', { fatal: false }).decode(slice)

    const title =
      extractMeta(html, 'og:title') ||
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim()
    const description =
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'description')
    let image = extractMeta(html, 'og:image')
    if (image && !image.startsWith('http')) {
      // Relative — resolve against the target
      try { image = new URL(image, target.origin).toString() } catch { image = '' }
    }
    const siteName = extractMeta(html, 'og:site_name') || target.hostname

    const preview: Preview = {
      url: target.toString(),
      title: decodeEntities(title).slice(0, 200),
      description: decodeEntities(description).slice(0, 400),
      image,
      siteName: decodeEntities(siteName).slice(0, 80),
    }

    return NextResponse.json(preview, {
      headers: {
        // Edge-cache for an hour so admin can hover repeatedly for free.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'fetch failed', detail: msg }, { status: 502 })
  }
}
