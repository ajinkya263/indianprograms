'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { Menu, X, User, ChevronDown, LogOut, Settings, LayoutDashboard, Share2, QrCode, Link2 } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      // Fast path: read cached session from local cookies (~1ms). Avoids the
      // ~100–300ms server round-trip that supabase.auth.getUser() costs on
      // every mount. Session is refreshed by the /admin middleware anyway,
      // so cookie state is fresh enough for the navbar UI.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      const currentUser = session?.user
      if (!currentUser) return

      setUser({ id: currentUser.id, email: currentUser.email })
      // Fire the profile fetch in parallel — we don't need to wait for it
      // before rendering the user chip; the display name just fills in.
      supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
        .then(({ data }) => {
          if (!cancelled && data) setProfile(data as Profile)
        })
    }

    hydrate()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email })
        // Profile only refetches when we actually have a new user id
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (!cancelled && data) setProfile(data as Profile)
          })
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardPath = profile?.role === 'admin' ? '/admin' : '/dashboard'

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#events', label: 'Browse Events' },
    { href: '/directory', label: 'Directory' },
    { href: 'https://mymediatoolbox.com/', label: 'Free Tools' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[#070510]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span
              className="text-3xl font-bold tracking-wide"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              <span style={{ color: '#FF9933' }}>Ind</span>
              <span style={{ color: '#FFFFFF' }}>ian</span>
              <span style={{ color: '#FFFFFF' }}>Pro</span>
              <span style={{ color: '#138808' }}>grams</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm text-gray-300 hover:text-white transition-colors py-1"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {link.label}
                <span className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-saffron origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/submit"
              className="group relative px-4 py-2 rounded-lg text-sm font-medium border transition-all overflow-hidden hover:shadow-[0_6px_18px_-6px_rgba(232,151,10,0.55)]"
              style={{ borderColor: '#E8970A', color: '#E8970A' }}
            >
              <span className="relative z-10 transition-colors duration-200 group-hover:text-black">Submit Event</span>
              <span className="absolute inset-0 bg-saffron origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
            {user ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User size={18} />
                  <span>{profile?.name || user.email || 'Account'}</span>
                  <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0F0D1A] border border-[#1A1726] shadow-xl py-2">
                    <Link
                      href={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <Link
                      href="/qr"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <QrCode size={16} />
                      QR Code Studio
                    </Link>
                    <Link
                      href="/shortlinks"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Link2 size={16} />
                      Short Links
                    </Link>
                    <Link
                      href="/social"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Share2 size={16} />
                      Social
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings size={16} />
                      Profile Settings
                    </Link>
                    <div className="border-t border-[#1A1726] my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-black transition-colors"
                  style={{ backgroundColor: '#E8970A' }}
                >
                  Become a Publisher
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-gray-300 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#070510]/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-gray-300 hover:text-white py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/submit"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium py-2 transition-colors"
              style={{ color: '#E8970A' }}
            >
              Submit Event
            </Link>
            <div className="border-t border-white/5 pt-3">
              {user ? (
                <>
                  <Link
                    href={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-sm text-gray-300 hover:text-white py-2"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <Link
                    href="/qr"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-sm text-gray-300 hover:text-white py-2"
                  >
                    <QrCode size={16} />
                    QR Code Studio
                  </Link>
                  <Link
                    href="/shortlinks"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-sm text-gray-300 hover:text-white py-2"
                  >
                    <Link2 size={16} />
                    Short Links
                  </Link>
                  <Link
                    href="/social"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-sm text-gray-300 hover:text-white py-2"
                  >
                    <Share2 size={16} />
                    Social
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 text-sm text-gray-300 hover:text-white py-2"
                  >
                    <Settings size={16} />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 text-sm text-red-400 hover:text-red-300 py-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-gray-300 hover:text-white py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="inline-block text-center px-4 py-2 rounded-lg text-sm font-medium text-black"
                    style={{ backgroundColor: '#E8970A' }}
                  >
                    Become a Publisher
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
