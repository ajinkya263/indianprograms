'use client'

import { useEffect, useState } from 'react'

// ── Peacock Feather — iridescent blue-green-gold ──
export function PeacockFeather({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pf-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a237e" />
          <stop offset="30%" stopColor="#0097A7" />
          <stop offset="60%" stopColor="#00BCD4" />
          <stop offset="80%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#8BC34A" />
        </radialGradient>
        <linearGradient id="pf-barb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#4CAF50" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8BC34A" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Central shaft */}
      <path d="M30 120 Q30 60 30 10" stroke="#5D4037" strokeWidth="1.2" opacity="0.5" />
      {/* Left barbs */}
      {[20, 30, 40, 50, 60, 70, 80, 90].map((y, i) => (
        <path key={`l${i}`} d={`M30 ${y} Q${18 - i} ${y - 8} ${10 - i * 0.5} ${y - 5}`} stroke="url(#pf-barb)" strokeWidth="0.8" fill="none" />
      ))}
      {/* Right barbs */}
      {[20, 30, 40, 50, 60, 70, 80, 90].map((y, i) => (
        <path key={`r${i}`} d={`M30 ${y} Q${42 + i} ${y - 8} ${50 + i * 0.5} ${y - 5}`} stroke="url(#pf-barb)" strokeWidth="0.8" fill="none" />
      ))}
      {/* Eye — the iconic peacock feather eye */}
      <ellipse cx="30" cy="28" rx="14" ry="18" fill="#4CAF50" opacity="0.3" />
      <ellipse cx="30" cy="28" rx="10" ry="14" fill="#00BCD4" opacity="0.4" />
      <ellipse cx="30" cy="28" rx="7" ry="10" fill="url(#pf-eye)" opacity="0.6" />
      <ellipse cx="30" cy="28" rx="4" ry="6" fill="#1a237e" opacity="0.7" />
      <ellipse cx="30" cy="27" rx="2" ry="3" fill="#FFD700" opacity="0.8" />
      {/* Iridescent shimmer spots */}
      <circle cx="28" cy="24" r="1" fill="#E0F7FA" opacity="0.6" />
      <circle cx="33" cy="30" r="0.8" fill="#B2DFDB" opacity="0.5" />
    </svg>
  )
}

// ── Sitar — elegant string instrument silhouette ──
export function Sitar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sitar-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B4513" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#D2691E" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Gourd body */}
      <ellipse cx="20" cy="100" rx="16" ry="12" fill="url(#sitar-wood)" />
      <ellipse cx="20" cy="98" rx="14" ry="10" fill="#D2691E" opacity="0.3" />
      {/* Neck */}
      <rect x="18" y="20" width="4" height="78" rx="2" fill="url(#sitar-wood)" />
      {/* Tuning pegs */}
      {[25, 30, 35, 40].map((y, i) => (
        <rect key={i} x={i % 2 === 0 ? 14 : 22} y={y} width="5" height="1.5" rx="0.75" fill="#8B4513" opacity="0.5" />
      ))}
      {/* Headstock */}
      <path d="M16 20 Q20 8 24 20" fill="url(#sitar-wood)" />
      <circle cx="20" cy="14" r="3" fill="#D2691E" opacity="0.4" />
      {/* Strings */}
      {[18.5, 19.5, 20.5, 21.5].map((x, i) => (
        <line key={i} x1={x} y1="15" x2={x} y2="98" stroke="#FFD700" strokeWidth="0.3" opacity={0.4 - i * 0.05} />
      ))}
      {/* Bridge */}
      <rect x="16" y="92" width="8" height="2" rx="1" fill="#5D4037" opacity="0.5" />
      {/* Decorative dots on body */}
      <circle cx="20" cy="100" r="2" fill="#FFD700" opacity="0.3" />
    </svg>
  )
}

// ── Tabla — pair of drums ──
export function Tabla({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tabla-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D2691E" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="tabla-skin" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#F5DEB3" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#DEB887" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      {/* Dayan (right drum — smaller, wooden) */}
      <path d="M8 18 C8 18 6 50 10 52 L28 52 C32 50 30 18 30 18Z" fill="url(#tabla-wood)" />
      <ellipse cx="19" cy="18" rx="11" ry="5" fill="url(#tabla-skin)" />
      <ellipse cx="19" cy="18" rx="11" ry="5" stroke="#8B4513" strokeWidth="0.8" opacity="0.4" fill="none" />
      {/* Syahi (black spot) */}
      <circle cx="19" cy="18" r="4" fill="#1a1a1a" opacity="0.4" />
      {/* Braided straps */}
      {[12, 15, 18, 21, 24, 27].map((x, i) => (
        <line key={`d${i}`} x1={x} y1="22" x2={x + (i % 2 ? 1 : -1)} y2="50" stroke="#8B7355" strokeWidth="0.6" opacity="0.35" />
      ))}
      {/* Bayan (left drum — larger, metal) */}
      <path d="M42 15 C42 15 38 50 44 52 L68 52 C74 50 70 15 70 15Z" fill="#A0A0A0" opacity="0.35" />
      <ellipse cx="56" cy="15" rx="14" ry="6" fill="url(#tabla-skin)" />
      <ellipse cx="56" cy="15" rx="14" ry="6" stroke="#808080" strokeWidth="0.8" opacity="0.4" fill="none" />
      {/* Syahi */}
      <circle cx="56" cy="15" r="5" fill="#1a1a1a" opacity="0.35" />
      {/* Braided straps */}
      {[46, 50, 54, 58, 62, 66].map((x, i) => (
        <line key={`b${i}`} x1={x} y1="20" x2={x + (i % 2 ? 1 : -1)} y2="50" stroke="#8B7355" strokeWidth="0.6" opacity="0.3" />
      ))}
    </svg>
  )
}

// ── Veena — classical instrument ──
export function Veena({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="veena-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B4513" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#D2691E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B4513" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Left gourd */}
      <circle cx="12" cy="20" r="10" fill="url(#veena-wood)" />
      <circle cx="12" cy="19" r="8" fill="#D2691E" opacity="0.25" />
      {/* Neck/tube */}
      <rect x="22" y="17" width="56" height="6" rx="3" fill="url(#veena-wood)" />
      {/* Right gourd (smaller) */}
      <circle cx="88" cy="20" r="8" fill="url(#veena-wood)" />
      {/* Frets */}
      {[30, 38, 45, 51, 56, 60, 64, 68, 72].map((x, i) => (
        <rect key={i} x={x} y="16" width="1" height="8" fill="#FFD700" opacity="0.25" />
      ))}
      {/* Strings */}
      <line x1="12" y1="18" x2="88" y2="18" stroke="#FFD700" strokeWidth="0.3" opacity="0.35" />
      <line x1="12" y1="20" x2="88" y2="20" stroke="#FFD700" strokeWidth="0.3" opacity="0.3" />
      <line x1="12" y1="22" x2="88" y2="22" stroke="#FFD700" strokeWidth="0.3" opacity="0.25" />
    </svg>
  )
}

// ── Rangoli Pattern — geometric mandala ──
export function RangoliPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="40" cy="40" r="35" stroke="#FF9933" strokeWidth="0.8" opacity="0.2" />
      {/* Petal shapes radiating out */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 40 + 25 * Math.cos(rad)
        const y = 40 + 25 * Math.sin(rad)
        return (
          <ellipse key={angle} cx={x} cy={y} rx="6" ry="12"
            fill={angle % 90 === 0 ? '#FF9933' : '#138808'} opacity="0.15"
            transform={`rotate(${angle} ${x} ${y})`} />
        )
      })}
      {/* Inner ring */}
      <circle cx="40" cy="40" r="18" stroke="#00BCD4" strokeWidth="0.6" opacity="0.2" />
      {/* Inner petals */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 40 + 12 * Math.cos(rad)
        const y = 40 + 12 * Math.sin(rad)
        return (
          <ellipse key={angle} cx={x} cy={y} rx="4" ry="8"
            fill="#E85D75" opacity="0.15"
            transform={`rotate(${angle} ${x} ${y})`} />
        )
      })}
      {/* Center */}
      <circle cx="40" cy="40" r="5" fill="#FFD700" opacity="0.2" />
      <circle cx="40" cy="40" r="2.5" fill="#FF9933" opacity="0.25" />
      {/* Dots between petals */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 40 + 30 * Math.cos(rad)
        const y = 40 + 30 * Math.sin(rad)
        return <circle key={angle} cx={x} cy={y} r="1.5" fill="#FF9933" opacity="0.2" />
      })}
    </svg>
  )
}

// ── Diya (kept but simplified) ──
export function Diya({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="diya-g" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FF9933" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="10" r="12" fill="url(#diya-g)" />
      <ellipse cx="20" cy="8" rx="4" ry="8" fill="#FF9933" opacity="0.8" />
      <ellipse cx="20" cy="9" rx="2.5" ry="5" fill="#FFD700" opacity="0.9" />
      <ellipse cx="20" cy="10" rx="1" ry="2.5" fill="#FFF" opacity="0.6" />
      <path d="M10 22 C10 18 14 16 20 16 C26 16 30 18 30 22 C30 24 26 26 20 26 C14 26 10 24 10 22Z" fill="#FF9933" opacity="0.6" />
      <rect x="14" y="26" width="12" height="3" rx="1.5" fill="#CC7722" opacity="0.5" />
    </svg>
  )
}

// Keeping these for backward compat but they won't be used in new themes
export function Lotus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="17" cy="20" rx="5" ry="11" fill="#E85D75" opacity="0.5" transform="rotate(-18 17 20)" />
      <ellipse cx="25" cy="17" rx="5.5" ry="13" fill="#E85D75" opacity="0.6" />
      <ellipse cx="33" cy="20" rx="5" ry="11" fill="#E85D75" opacity="0.5" transform="rotate(18 33 20)" />
      <ellipse cx="10" cy="24" rx="4" ry="9" fill="#E85D75" opacity="0.35" transform="rotate(-40 10 24)" />
      <ellipse cx="40" cy="24" rx="4" ry="9" fill="#E85D75" opacity="0.35" transform="rotate(40 40 24)" />
      <circle cx="25" cy="21" r="3.5" fill="#F4C430" opacity="0.7" />
      <circle cx="25" cy="21" r="1.8" fill="#FFD700" opacity="0.8" />
    </svg>
  )
}

export function Paisley({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 5 C25 5 28 15 28 22 C28 30 22 35 15 35 C10 35 7 30 7 25 C7 18 12 15 15 15 C18 15 20 18 20 22 C20 25 18 27 15 27"
        stroke="#138808" strokeWidth="1.5" fill="none" opacity="0.2"/>
    </svg>
  )
}

export function ChakraElement({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#000080" strokeWidth="1" opacity="0.15"/>
      <circle cx="12" cy="12" r="3" fill="#000080" opacity="0.15"/>
      {Array.from({length: 12}).map((_, i) => {
        const angle = (i * 30) * Math.PI / 180
        return <line key={i} x1={12 + 3 * Math.cos(angle)} y1={12 + 3 * Math.sin(angle)} x2={12 + 10 * Math.cos(angle)} y2={12 + 10 * Math.sin(angle)} stroke="#000080" strokeWidth="0.5" opacity="0.1"/>
      })}
    </svg>
  )
}

// Unused — kept for backward compat
export function TraditionalDiya({ className }: { className?: string }) { return <Diya className={className} /> }
export function ZenduGarland({ className }: { className?: string }) { return <div className={className} /> }
export function Toran({ className }: { className?: string }) { return <div className={className} /> }
export function DeepJyoti({ className }: { className?: string }) { return <Diya className={className} /> }

// ═══════════════════════════════════════════════
// THEMED HERO DECORATIONS — randomly selected
// ═══════════════════════════════════════════════

interface DecorationItem {
  component: React.FC<{ className?: string }>
  className: string
}

const THEME_PEACOCK: DecorationItem[] = [
  { component: PeacockFeather, className: 'absolute top-8 left-[5%] w-16 h-32 pointer-events-none animate-float opacity-50' },
  { component: PeacockFeather, className: 'absolute top-12 right-[6%] w-14 h-28 pointer-events-none animate-float-delayed opacity-40 -scale-x-100' },
  { component: PeacockFeather, className: 'absolute bottom-16 left-[15%] w-12 h-24 pointer-events-none animate-float opacity-35 rotate-12' },
  { component: RangoliPattern, className: 'absolute bottom-8 right-[12%] w-20 h-20 pointer-events-none animate-float-delayed opacity-30' },
  { component: Lotus, className: 'absolute top-24 left-[35%] w-12 h-10 pointer-events-none animate-float opacity-40' },
  { component: Diya, className: 'absolute top-16 right-[30%] w-10 h-12 pointer-events-none animate-float-delayed opacity-50' },
]

const THEME_INSTRUMENTS: DecorationItem[] = [
  { component: Sitar, className: 'absolute top-4 left-[4%] w-10 h-28 pointer-events-none animate-float opacity-40 -rotate-12' },
  { component: Tabla, className: 'absolute bottom-12 right-[5%] w-20 h-16 pointer-events-none animate-float-delayed opacity-35' },
  { component: Veena, className: 'absolute top-20 right-[8%] w-24 h-10 pointer-events-none animate-float opacity-30 rotate-6' },
  { component: Sitar, className: 'absolute bottom-20 left-[12%] w-8 h-24 pointer-events-none animate-float-delayed opacity-30 rotate-6' },
  { component: RangoliPattern, className: 'absolute top-28 left-[28%] w-16 h-16 pointer-events-none animate-float opacity-25' },
  { component: Diya, className: 'absolute top-10 right-[25%] w-10 h-12 pointer-events-none animate-float-delayed opacity-45' },
]

const THEME_FESTIVE: DecorationItem[] = [
  { component: Diya, className: 'absolute top-12 left-[6%] w-10 h-12 pointer-events-none animate-float opacity-60' },
  { component: Diya, className: 'absolute top-8 right-[7%] w-8 h-10 pointer-events-none animate-float-delayed opacity-50' },
  { component: RangoliPattern, className: 'absolute bottom-8 left-[8%] w-24 h-24 pointer-events-none animate-float-delayed opacity-25' },
  { component: RangoliPattern, className: 'absolute top-16 right-[20%] w-16 h-16 pointer-events-none animate-float opacity-20' },
  { component: Lotus, className: 'absolute bottom-16 right-[10%] w-14 h-12 pointer-events-none animate-float opacity-40' },
  { component: PeacockFeather, className: 'absolute top-20 left-[25%] w-10 h-20 pointer-events-none animate-float-delayed opacity-30' },
  { component: Paisley, className: 'absolute bottom-24 left-[40%] w-8 h-10 pointer-events-none animate-float opacity-25' },
]

const THEME_CLASSICAL: DecorationItem[] = [
  { component: Veena, className: 'absolute top-12 left-[3%] w-28 h-12 pointer-events-none animate-float opacity-30 -rotate-6' },
  { component: PeacockFeather, className: 'absolute top-8 right-[5%] w-14 h-28 pointer-events-none animate-float-delayed opacity-45' },
  { component: Tabla, className: 'absolute bottom-8 left-[10%] w-16 h-12 pointer-events-none animate-float-delayed opacity-30' },
  { component: Sitar, className: 'absolute bottom-12 right-[8%] w-8 h-24 pointer-events-none animate-float opacity-35 rotate-6' },
  { component: Lotus, className: 'absolute top-28 left-[40%] w-12 h-10 pointer-events-none animate-float opacity-35' },
  { component: Diya, className: 'absolute top-16 right-[35%] w-8 h-10 pointer-events-none animate-float-delayed opacity-45' },
]

const ALL_THEMES = [THEME_PEACOCK, THEME_INSTRUMENTS, THEME_FESTIVE, THEME_CLASSICAL]

/**
 * HeroDecorations — renders a randomly selected theme of floating decorative SVGs.
 * Theme changes on each page load.
 */
export function HeroDecorations() {
  const [theme, setTheme] = useState<DecorationItem[]>([])

  useEffect(() => {
    const idx = Math.floor(Math.random() * ALL_THEMES.length)
    setTheme(ALL_THEMES[idx])
  }, [])

  if (theme.length === 0) return null

  return (
    <>
      {theme.map((item, i) => {
        const Comp = item.component
        return <Comp key={i} className={item.className} />
      })}
    </>
  )
}
