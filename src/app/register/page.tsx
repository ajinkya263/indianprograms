'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, LogIn, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          role: 'publisher',
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-white mb-2">
                Create Account
              </h1>
              <p className="text-gray-400 font-body text-sm">
                Register as an Event Publisher to submit and manage cultural events
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success ? (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-6 text-center">
                <p className="text-green-400 font-medium mb-2">Registration successful!</p>
                <p className="text-sm text-gray-400">
                  Check your email to confirm your account.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-4 text-saffron hover:text-saffron-light text-sm font-medium transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-dark-border bg-dark-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-dark-border bg-dark-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Create a password"
                        className="w-full rounded-lg border border-dark-border bg-dark-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirm your password"
                        className="w-full rounded-lg border border-dark-border bg-dark-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-saffron focus:outline-none focus:ring-1 focus:ring-saffron transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-2.5 text-sm font-semibold text-dark hover:bg-saffron-light focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-saffron hover:text-saffron-light font-medium transition-colors">
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
