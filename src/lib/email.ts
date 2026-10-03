/**
 * Tiny email helper.
 *
 * Prefers Resend (https://resend.com) if RESEND_API_KEY is set — otherwise
 * logs the outgoing email to the server console so nothing crashes when
 * a provider isn't configured yet. Callers should never rely on the
 * return value; email sending is fire-and-forget.
 */

interface SendArgs {
  to: string
  subject: string
  html: string
  text?: string
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'IndianPrograms <no-reply@indianprograms.com>'

export async function sendEmail(args: SendArgs): Promise<void> {
  // No provider — surface the content in server logs and move on.
  if (!RESEND_API_KEY) {
    console.log('[email:no-provider] to=%s subject=%s', args.to, args.subject)
    console.log(args.text || args.html.replace(/<[^>]+>/g, ''))
    return
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    })
    if (!resp.ok) {
      const body = await resp.text()
      console.warn('[email] resend failed', resp.status, body)
    }
  } catch (err: any) {
    console.warn('[email] send error', err?.message)
  }
}

/** Escape user-supplied strings before dropping them into an HTML template. */
export function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Wrap body content in a simple centered-card HTML shell. */
export function renderEmail(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5efe0;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#2b2419;">
    <div style="max-width:560px;margin:0 auto;background:#faf4e4;border:1px solid #c9b98f;border-radius:14px;padding:28px;">
      <div style="text-align:center;font-size:22px;font-weight:700;margin-bottom:8px;letter-spacing:0.02em;">
        <span style="color:#B8471E;">Ind</span><span>ian</span><span>Pro</span><span style="color:#2E7D32;">grams</span>
      </div>
      <div style="text-align:center;color:#7b6c55;font-size:13px;margin-bottom:20px;">${escapeHtml(title)}</div>
      <div style="font-size:15px;line-height:1.55;">${bodyHtml}</div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #c9b98f;font-size:12px;color:#8b7b62;text-align:center;">
        <a href="https://indianprograms.com" style="color:#A0522D;text-decoration:none;">indianprograms.com</a>
      </div>
    </div>
  </body>
</html>`
}
