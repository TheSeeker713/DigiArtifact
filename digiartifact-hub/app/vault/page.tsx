'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, KeyRound, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function VaultPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsValid(false)
    setIsValidating(true)

    // Simulate API validation
    setTimeout(() => {
      const trimmedCode = code.trim().toUpperCase()
      
      // Demo validation - accepts any code matching pattern: XXXX-XXXXX-XXXX
      const validPattern = /^[A-Z0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{4}$/
      
      if (!trimmedCode) {
        setError('Please enter an access code')
        setIsValidating(false)
        return
      }
      
      if (!validPattern.test(trimmedCode)) {
        setError('Invalid code format. Use format: XXXX-XXXXX-XXXX')
        setIsValidating(false)
        return
      }

      // For demo: Accept any properly formatted code
      setIsValid(true)
      setIsValidating(false)
    }, 1200)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-24 md:py-20">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold/10 mb-4 sm:mb-6">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gold mb-2 sm:mb-3">
            The Vault
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed px-2">
            Enter your access code to retrieve your digital artifacts
          </p>
        </div>

        {/* Vault Access Form */}
        <form onSubmit={handleSubmit} className="excavation-border bg-slate/30 p-4 sm:p-6 md:p-8">
          <div className="mb-6">
            <label htmlFor="code" className="flex items-center gap-2 text-sm font-mono text-gold mb-2">
              <KeyRound className="w-4 h-4" />
              ACCESS CODE
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXXX-XXXX"
              disabled={isValidating || isValid}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-obsidian border-2 border-slate rounded-lg 
                       font-mono text-sand text-center text-base sm:text-lg tracking-wider
                       focus:border-gold focus:outline-none transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              maxLength={16}
            />
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Found in your purchase confirmation email
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isValid && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300 font-bold">Access Granted!</p>
              </div>
              <div className="pl-7 text-sm text-slate-300">
                <p className="mb-2">Your vault contains:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Dark Fantasy Coloring Collection (3 files)</li>
                  <li>Download links valid for 30 days</li>
                  <li>Unlimited downloads during access period</li>
                </ul>
                <p className="mt-3 text-xs text-slate-400">
                  <span className="text-hologram-cyan">[DEMO]</span> In production, download links would appear here.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isValidating || isValid || !code.trim()}
            className="w-full btn-rune disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-obsidian border-t-transparent rounded-full animate-spin" />
                VALIDATING...
              </span>
            ) : isValid ? (
              'ACCESS GRANTED'
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                UNLOCK VAULT
              </span>
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 mb-4">Need help accessing your artifacts?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@digiartifact.com"
              className="px-4 py-2 bg-slate/50 hover:bg-slate text-sand rounded-lg 
                       text-sm font-mono transition-colors"
            >
              Contact Support
            </a>
            <a
              href="#"
              className="px-4 py-2 bg-slate/50 hover:bg-slate text-sand rounded-lg 
                       text-sm font-mono transition-colors"
            >
              Resend Code
            </a>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 excavation-border bg-gold/5 p-4">
          <p className="text-xs text-slate-400 font-mono text-center">
            <span className="text-hologram-cyan">[DEMO]</span> Use format: XXXX-XXXXX-XXXX 
            (e.g., TEST-12345-ABCD)
          </p>
        </div>
      </div>
    </main>
  )
}
