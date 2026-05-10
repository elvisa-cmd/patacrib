'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-sans text-[13px] uppercase tracking-widest text-muted mb-3">Something went wrong</p>
        <h1 className="font-serif text-[28px] text-ink mb-3">This page couldn&apos;t load</h1>
        <p className="font-sans text-[14px] text-muted mb-8">
          There was a problem connecting to the server. This is usually temporary.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-accent text-white font-sans font-bold text-[12px] uppercase tracking-wide px-5 py-2.5 hover:bg-accent-d transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-border text-ink font-sans font-bold text-[12px] uppercase tracking-wide px-5 py-2.5 hover:bg-surface2 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
