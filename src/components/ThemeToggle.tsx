'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * Dark ↔ Classic (beige) theme toggle.
 *
 * The theme is persisted in localStorage so it survives navigation and
 * refresh. An inline script in layout.tsx applies the stored theme
 * before hydration so users don't see the dark theme flash first.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'classic'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = (localStorage.getItem('theme') || 'dark') as 'dark' | 'classic'
    setTheme(stored)
    document.documentElement.setAttribute('data-theme', stored)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'classic' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch { /* private mode */ }
  }

  // Placeholder-size the button before hydration to avoid layout shift.
  if (!mounted) {
    return <div className="w-9 h-9" aria-hidden />
  }

  const isClassic = theme === 'classic'
  return (
    <button
      onClick={toggle}
      title={isClassic ? 'Switch to dark theme' : 'Switch to classic theme'}
      aria-label={isClassic ? 'Switch to dark theme' : 'Switch to classic theme'}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors hover:opacity-90"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        color: 'var(--accent)',
      }}
    >
      {isClassic ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
