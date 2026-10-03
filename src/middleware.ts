import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Only run the auth-refresh middleware on routes that actually need a
  // fresh Supabase session. The old matcher fired on every page — including
  // the home page and every event detail — which meant every navigation
  // paid a supabase.auth.getUser() round-trip (~100–300ms) even for
  // signed-out visitors browsing the public site.
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/settings/:path*',
    '/social/:path*',
    '/qr/:path*',
    '/shortlinks/:path*',
    '/submit',
    '/register',
    '/login',
    '/directory/submit',
    '/directory/:path/edit',
    '/api/((?!cron).*)',
  ],
}
