'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/shared/AuthBackground'
import { FloatingInput } from '@/components/shared/FloatingInput'

// ── Design tokens ─────────────────────────────────────────────────────────────

const LIME  = '#c8f064'
const GREEN = '#1a6b4a'

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Password strength ─────────────────────────────────────────────────────────

function calcScore(pw: string): number {
  let s = 0
  if (pw.length >= 8)           s++
  if (/[A-Z]/.test(pw))         s++
  if (/[0-9]/.test(pw))         s++
  if (/[^A-Za-z0-9]/.test(pw))  s++
  return s
}

const SCORE_COLOR = ['', '#dc2626', '#e8a020', '#2563eb', GREEN] as const
const SCORE_LABEL = ['', 'Weak',    'Fair',    'Good',   'Strong'] as const

function StrengthBar({ password }: { password: string }) {
  if (!password) return null
  const score = calcScore(password)
  const color = SCORE_COLOR[score]
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="flex-1 transition-all duration-300"
            style={{ height: '3px', borderRadius: '2px', background: i <= score ? color : '#eceae4' }}
          />
        ))}
      </div>
      <p className="font-sans text-[10px] text-right" style={{ color }}>
        {SCORE_LABEL[score]}
      </p>
    </div>
  )
}

// ── Account type card ─────────────────────────────────────────────────────────

function AccountTypeCard({
  emoji, role, desc, selected, onClick, badge,
}: {
  emoji: string; role: string; desc: string; selected: boolean; onClick: () => void; badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-1 text-left transition-all duration-200 focus:outline-none"
      style={{
        padding:    '18px 16px',
        border:     `1.5px solid ${selected ? GREEN : 'rgba(15,14,12,0.12)'}`,
        background: selected
          ? 'linear-gradient(135deg, #e6f2ec 0%, #f0f7f2 100%)'
          : 'white',
        overflow: 'visible',
      }}
    >
      {badge && (
        <span
          className="absolute font-sans font-bold uppercase"
          style={{
            top:           '-8px',
            right:         '12px',
            background:    GREEN,
            color:         'white',
            fontSize:      '8px',
            letterSpacing: '1px',
            padding:       '2px 8px',
          }}
        >
          {badge}
        </span>
      )}

      <div className="flex justify-between items-start">
        <span style={{ fontSize: '32px', lineHeight: 1 }}>{emoji}</span>
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width:        '16px',
            height:       '16px',
            borderRadius: '50%',
            border:       selected ? 'none' : '1.5px solid #b5b1aa',
            background:   selected ? GREEN : 'white',
          }}
        >
          {selected && (
            <span className="text-white font-bold" style={{ fontSize: '8px', lineHeight: 1 }}>✓</span>
          )}
        </div>
      </div>
      <p className="font-sans font-bold text-[13px] mt-2.5" style={{ color: selected ? GREEN : '#0f0e0c' }}>
        {role}
      </p>
      <p className="font-sans text-[11px] leading-relaxed mt-1" style={{ color: '#87837c' }}>
        {desc}
      </p>
    </button>
  )
}

// ── Field stagger helper ──────────────────────────────────────────────────────

const stagger = (delay: number) => ({
  animation: `fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
})

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter()

  const [accountType,     setAccountType]     = useState<'SEEKER' | 'ADMIN'>('SEEKER')
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [agreedToTerms,   setAgreedToTerms]   = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [btnHovered,      setBtnHovered]      = useState(false)

  const passwordsMatch  = confirmPassword.length > 0 && confirmPassword === password
  const confirmMismatch = confirmPassword.length > 0 && !passwordsMatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!passwordsMatch)      { setError('Passwords do not match'); return }

    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, phone: phone || undefined, userType: accountType }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.message ?? 'Signup failed. Please try again.')
      setLoading(false)
      return
    }

    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ════════════════════════════════════════════════
          LEFT PANEL
      ════════════════════════════════════════════════ */}
      <div className="hidden md:flex w-[45%] min-h-screen flex-col relative overflow-hidden flex-shrink-0 animate-slide-in-left">
      <AuthBackground
        className="absolute inset-0"
        contentClass="flex flex-col h-full p-12"
      >

          {/* Logo mark */}
          <div>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="20" r="10" stroke={LIME} strokeWidth="2.5"/>
              <circle cx="24" cy="20" r="4"  fill={LIME}/>
              <path d="M24 30 L24 48" stroke={LIME} strokeWidth="2" opacity="0.4"/>
              <ellipse cx="24" cy="46" rx="8" ry="2" fill={LIME} opacity="0.2"/>
            </svg>
            <p className="font-sans font-black text-white mt-3" style={{ fontSize: '22px' }}>
              PataCrib
            </p>
          </div>

          {/* Headline + features */}
          <div className="flex-1 flex flex-col justify-center">
            <h2
              className="font-sans font-black text-white"
              style={{ fontSize: '56px', lineHeight: 0.92, letterSpacing: '-3px' }}
            >
              Your<br />
              <span style={{ color: LIME }}>perfect</span><br />
              home<br />
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>awaits.</span>
            </h2>

            <div className="mt-6">
              {[
                { icon: '📍', title: 'GPS Precision',  sub: 'Every listing pinned to 3 metres' },
                { icon: '🚌', title: 'Matatu Routes',  sub: 'Know your commute before you move' },
                { icon: '💧', title: 'Water Schedule', sub: 'No surprises — verified supply info' },
              ].map(({ icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3 mb-3.5">
                  <div
                    className="flex items-center justify-center text-[14px] flex-shrink-0"
                    style={{
                      width:      '32px',
                      height:     '32px',
                      background: 'rgba(200,240,100,0.1)',
                      border:     '1px solid rgba(200,240,100,0.2)',
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="font-sans font-bold text-[13px] text-white leading-none">{title}</p>
                    <p className="font-sans text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating property card */}
          <div>
            <div
              className="mb-5 animate-float"
              style={{
                background:           'rgba(255,255,255,0.06)',
                border:               '1px solid rgba(255,255,255,0.1)',
                backdropFilter:       'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding:              '16px 20px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: LIME }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: LIME }} />
                </span>
                <p className="font-sans font-bold uppercase" style={{ fontSize: '9px', letterSpacing: '2px', color: LIME }}>
                  Available now
                </p>
              </div>

              <p className="font-sans font-bold text-white" style={{ fontSize: '15px', margin: '8px 0 4px' }}>
                2BR Apartment — Kilimani
              </p>
              <p className="font-sans" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                Raphta Road · GPS Verified
              </p>

              <div
                className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <span className="font-serif text-white" style={{ fontSize: '20px' }}>KSh 55,000</span>
                  <span className="font-sans ml-1" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <div className="w-5 flex-shrink-0" style={{ borderTop: '1px dashed rgba(255,255,255,0.2)' }} />
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LIME }} />
                  <span className="font-sans text-[10px] ml-0.5" style={{ color: LIME }}>1.2km</span>
                </div>
              </div>
            </div>

            <p className="font-sans text-[12px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Already have an account?
            </p>
            <Link
              href="/login"
              className="font-sans font-bold text-[12px] hover:opacity-80 transition-opacity"
              style={{ color: LIME }}
            >
              Sign in →
            </Link>
          </div>
      </AuthBackground>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT PANEL
      ════════════════════════════════════════════════ */}
      <main
        className="flex-1 min-h-screen flex items-center justify-center py-12 px-8 overflow-y-auto"
        style={{
          backgroundColor:  '#faf8f5',
          backgroundImage:  'radial-gradient(rgba(15,14,12,0.06) 1px, transparent 1px)',
          backgroundSize:   '24px 24px',
        }}
      >
        <div
          className="w-full max-w-[440px]"
          style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
        >

          {/* Mobile-only logo */}
          <Link href="/" className="font-sans font-black text-[20px] tracking-tight mb-8 block md:hidden">
            <span className="text-ink">Pata</span>
            <span className="text-accent">Crib</span>
          </Link>

          {/* Eyebrow */}
          <div
            className="inline-flex items-center font-sans font-bold text-accent mb-4"
            style={{
              background:    '#e6f2ec',
              border:        '1px solid rgba(26,107,74,0.2)',
              padding:       '5px 14px',
              fontSize:      '9px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}
          >
            ✦ Join for free
          </div>

          {/* Heading */}
          <h1
            className="font-serif text-[36px] text-ink leading-none mb-1.5"
            style={{ letterSpacing: '-1px' }}
          >
            Create your account
          </h1>
          <p className="font-sans font-light text-[14px] text-muted mb-9">
            Find your exact home in Nairobi today
          </p>

          {/* Error box */}
          {error && (
            <div className="bg-[#fef2f2] border border-[#fecaca] px-4 py-3 mb-6">
              <p className="font-sans text-[13px] text-red">⚠ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Account type ──────────────────────────── */}
            <div style={stagger(0.3)}>
              <p
                className="font-sans font-semibold uppercase text-muted mb-3"
                style={{ fontSize: '9px', letterSpacing: '1px' }}
              >
                I want to...
              </p>
              <div className="grid grid-cols-2 gap-2.5" style={{ overflow: 'visible', paddingTop: '8px' }}>
                <AccountTypeCard
                  emoji="🔍"
                  role="Find a home"
                  desc="Browse and save rental properties across Nairobi"
                  selected={accountType === 'SEEKER'}
                  onClick={() => setAccountType('SEEKER')}
                  badge="Most popular"
                />
                <AccountTypeCard
                  emoji="🏠"
                  role="List a property"
                  desc="Upload your property and reach thousands of seekers"
                  selected={accountType === 'ADMIN'}
                  onClick={() => setAccountType('ADMIN')}
                />
              </div>
            </div>

            {/* ── Fields ────────────────────────────────── */}
            <div className="flex flex-col gap-2 mt-8">

              {/* Name */}
              <div style={stagger(0.35)}>
                <FloatingInput
                  id="name"
                  label="Full name"
                  value={name}
                  onChange={setName}
                  helper="👋 How we'll greet you on the platform"
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email */}
              <div style={stagger(0.4)}>
                <FloatingInput
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  helper="🔐 Your secure login email"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Phone */}
              <div style={stagger(0.45)}>
                <FloatingInput
                  id="phone"
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  helper="📞 For direct landlord contact"
                  optional
                  autoComplete="tel"
                />
              </div>

              {/* Password */}
              <div style={stagger(0.5)}>
                <FloatingInput
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
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
                <StrengthBar password={password} />
              </div>

              {/* Confirm password */}
              <div style={stagger(0.55)}>
                <FloatingInput
                  id="confirmPassword"
                  label="Confirm password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  error={confirmMismatch ? 'Passwords do not match' : undefined}
                  autoComplete="new-password"
                  required
                  rightNode={
                    confirmPassword.length > 0 ? (
                      <span
                        className="font-bold text-[14px]"
                        style={{ color: passwordsMatch ? GREEN : '#ef4444' }}
                      >
                        {passwordsMatch ? '✓' : '✗'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirm(s => !s)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className="text-muted hover:text-ink transition-colors"
                      >
                        {showConfirm ? <EyeOff /> : <Eye />}
                      </button>
                    )
                  }
                />
              </div>
            </div>

            {/* ── Submit section ────────────────────────── */}
            <div className="flex flex-col gap-4 mt-8" style={stagger(0.6)}>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                  style={{ accentColor: GREEN }}
                />
                <span className="font-sans text-[11px] leading-relaxed" style={{ color: '#87837c' }}>
                  I agree to PataKrib&apos;s{' '}
                  <Link href="#" className="text-accent hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="#" className="text-accent hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {/* Button */}
              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                className="group w-full text-white font-sans font-bold text-[13px] uppercase flex items-center justify-between disabled:opacity-70"
                style={{
                  padding:    '15px 24px',
                  letterSpacing: '0.8px',
                  background: btnHovered
                    ? 'linear-gradient(135deg, #145c3d 0%, #1a6b4a 100%)'
                    : 'linear-gradient(135deg, #1a6b4a 0%, #2d9e6e 100%)',
                  transform:  btnHovered && !loading && agreedToTerms ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow:  btnHovered && !loading && agreedToTerms ? '0 8px 24px rgba(26,107,74,0.3)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span className="flex items-center gap-2">
                  {loading && <Spinner />}
                  {loading ? 'Creating account...' : 'Create my free account'}
                </span>
                <span
                  className="group-hover:translate-x-1"
                  style={{ transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1)', display: 'inline-block' }}
                >
                  →
                </span>
              </button>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-5">
                {['🔒 Secure & private', '✓ Free forever', '📍 GPS verified'].map(item => (
                  <p key={item} className="font-sans text-[10px] whitespace-nowrap" style={{ color: '#b5b1aa' }}>
                    {item}
                  </p>
                ))}
              </div>

              <p className="text-center font-sans text-[12px]" style={{ color: '#87837c' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-accent hover:underline">Sign in →</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
