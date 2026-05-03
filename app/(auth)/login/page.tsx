'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/shared/AuthBackground'
import { FloatingInput } from '@/components/shared/FloatingInput'

// ── Icons & spinner ───────────────────────────────────────────────────────────

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
      aria-hidden="true"
    />
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [btnHovered,   setBtnHovered]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left column (dark) ────────────────────────────────── */}
      <div className="hidden md:flex w-[45%] min-h-screen flex-col relative overflow-hidden flex-shrink-0">
      <AuthBackground
        className="absolute inset-0"
        contentClass="flex flex-col justify-between h-full p-[52px]"
      >

        {/* Logo */}
        <Link href="/" className="font-sans font-black text-[20px] tracking-tight">
          <span className="text-white">Pata</span>
          <span className="text-accent">Crib</span>
        </Link>

        {/* Tagline */}
        <div>
          <h2
            className="font-serif text-white font-light leading-[1.1]"
            style={{ fontSize: '36px', letterSpacing: '-1px' }}
          >
            Find your<br />
            <em className="text-accent">exact</em> home<br />
            in Nairobi.
          </h2>

          <div className="flex flex-col gap-3 mt-8">
            {[
              '📍 GPS-pinned to the metre',
              '🚌 Matatu routes included',
              '💧 Water schedule verified',
            ].map(pill => (
              <p key={pill} className="font-sans text-[13px] text-white/60">{pill}</p>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div>
          <p className="font-sans text-[12px] text-white/40 mb-1">New to PataKrib?</p>
          <Link href="/signup" className="font-sans text-[12px] text-accent hover:text-accent-d transition-colors">
            Create an account →
          </Link>
        </div>
      </AuthBackground>
      </div>

      {/* ── Right column (form) ───────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 md:p-[52px]"
        style={{
          backgroundColor: '#faf8f5',
          backgroundImage: 'radial-gradient(rgba(15,14,12,0.06) 1px, transparent 1px)',
          backgroundSize:  '24px 24px',
        }}
      >
        <div className="w-full max-w-[400px]">

          {/* Mobile-only logo */}
          <Link href="/" className="font-sans font-black text-[20px] tracking-tight mb-8 block md:hidden">
            <span className="text-ink">Pata</span>
            <span className="text-accent">Crib</span>
          </Link>

          {/* Heading */}
          <h1
            className="font-serif text-[32px] text-ink leading-tight mb-1"
            style={{ letterSpacing: '-0.5px' }}
          >
            Welcome back
          </h1>
          <p className="font-sans font-light text-[14px] text-muted mb-9">
            Sign in to your PataKrib account
          </p>

          {/* Error box */}
          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] px-4 py-3 mb-6">
              <p className="font-sans text-[13px] text-red">⚠ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">

            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />

            <div>
              <FloatingInput
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                required
                rightNode={
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-muted hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
              />
              <div className="flex justify-end mt-1">
                <Link href="#" className="font-sans text-[11px] text-accent hover:text-accent-d transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              className="w-full text-white font-sans font-bold text-[13px] uppercase tracking-[0.5px] disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              style={{
                padding:    '15px 24px',
                background: btnHovered
                  ? 'linear-gradient(135deg, #145c3d 0%, #1a6b4a 100%)'
                  : 'linear-gradient(135deg, #1a6b4a 0%, #2d9e6e 100%)',
                transform:  btnHovered && !loading ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow:  btnHovered && !loading ? '0 8px 24px rgba(26,107,74,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {loading && <Spinner />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="flex items-center my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="font-sans text-[11px] text-muted px-3">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <p className="text-center font-sans text-[12px] text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-accent hover:text-accent-d transition-colors">
                Create one →
              </Link>
            </p>
          </form>

          {/* Terms note */}
          <p className="font-sans text-[10px] text-muted text-center mt-8 leading-relaxed">
            By signing in you agree to our{' '}
            <Link href="#" className="text-accent hover:text-accent-d transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="text-accent hover:text-accent-d transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
