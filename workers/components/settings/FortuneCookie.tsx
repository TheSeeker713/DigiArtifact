'use client'

import { useState } from 'react'

const FORTUNES = [
  "Your code will compile on the first try... eventually.",
  "A bug in production builds character.",
  "The semicolon you forgot is in line 42.",
  "Your next commit will be legendary.",
  "Stack Overflow has the answer you seek.",
  "Refactoring today saves debugging tomorrow.",
  "The variable you need is closer than you think.",
  "A senior developer once started as a junior too.",
  "Your pull request will be approved with minor comments.",
  "The documentation you need exists somewhere.",
  "Console.log is your friend in times of need.",
  "Git push --force is never the answer... usually.",
  "Your keyboard will bring you fortune and functions.",
  "The error message contains the truth you seek.",
  "A well-named variable is worth a thousand comments.",
]

export default function FortuneCookie() {
  const [isCracked, setIsCracked] = useState(false)
  const [fortune, setFortune] = useState('')

  const crackCookie = () => {
    if (!isCracked) {
      const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
      setFortune(randomFortune)
      setIsCracked(true)
    }
  }

  const resetCookie = () => {
    setIsCracked(false)
    setFortune('')
  }

  return (
    <details className="mt-6 group">
      <summary className="text-text-slate/30 text-xs cursor-pointer hover:text-text-slate/50 transition-colors">
        🤫
      </summary>
      <div className="mt-4 p-6 bg-obsidian/50 rounded-lg border border-relic-gold/20 text-center">
        {!isCracked ? (
          <>
            <button
              onClick={crackCookie}
              className="focus:outline-none transform hover:scale-105 transition-transform cursor-pointer"
              aria-label="Click to crack the fortune cookie"
            >
              <svg className="w-32 h-32 mx-auto mb-4" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Fortune Cookie - Whole */}
                <ellipse cx="64" cy="70" rx="50" ry="28" fill="#E8B84A" />
                <path d="M14 70 Q64 30 114 70" fill="#F5C563" stroke="#D4A43A" strokeWidth="2"/>
                <path d="M14 70 Q64 95 114 70" fill="#E8B84A" stroke="#D4A43A" strokeWidth="2"/>
                {/* Cookie texture lines */}
                <path d="M30 65 Q50 55 70 65" stroke="#D4A43A" strokeWidth="1.5" fill="none" opacity="0.5"/>
                <path d="M50 60 Q70 50 90 60" stroke="#D4A43A" strokeWidth="1.5" fill="none" opacity="0.5"/>
                {/* Shine */}
                <ellipse cx="45" cy="55" rx="12" ry="6" fill="#FFF5CC" opacity="0.4"/>
              </svg>
            </button>
            <p className="text-relic-gold font-heading text-lg mb-2">🥠 Fortune Cookie 🥠</p>
            <p className="text-text-slate text-sm">Click the cookie to reveal your fortune!</p>
          </>
        ) : (
          <>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Left cookie half */}
                <g transform="translate(-15, 0) rotate(-15, 50, 70)">
                  <path d="M30 70 Q50 45 70 70 Q50 85 30 70" fill="#E8B84A" stroke="#D4A43A" strokeWidth="2"/>
                  <ellipse cx="48" cy="60" rx="8" ry="4" fill="#FFF5CC" opacity="0.3"/>
                </g>
                {/* Right cookie half */}
                <g transform="translate(15, 0) rotate(15, 78, 70)">
                  <path d="M58 70 Q78 45 98 70 Q78 85 58 70" fill="#E8B84A" stroke="#D4A43A" strokeWidth="2"/>
                  <ellipse cx="80" cy="60" rx="8" ry="4" fill="#FFF5CC" opacity="0.3"/>
                </g>
                {/* Fortune paper */}
                <rect x="44" y="55" width="40" height="20" rx="2" fill="#FFFFFF" stroke="#E0E0E0"/>
                <line x1="48" y1="62" x2="80" y2="62" stroke="#666" strokeWidth="0.5"/>
                <line x1="48" y1="67" x2="75" y2="67" stroke="#666" strokeWidth="0.5"/>
              </svg>
            </div>
            <p className="text-relic-gold font-heading text-lg mb-3">✨ Your Fortune ✨</p>
            <p className="text-sand text-base italic mb-4 max-w-xs mx-auto">"{fortune}"</p>
            <button
              onClick={resetCookie}
              className="text-text-slate/50 text-xs hover:text-text-slate transition-colors underline"
            >
              Get another cookie
            </button>
          </>
        )}
        <p className="text-text-slate/50 text-xs mt-4 italic">- Your friendly coding assistant</p>
      </div>
    </details>
  )
}
