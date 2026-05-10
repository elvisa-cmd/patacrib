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
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
      <div className="text-center px-6">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="font-serif text-3xl text-[#0f0e0c] mb-3">
          Something went wrong
        </h2>
        <p className="text-[#87837c] text-sm mb-8 max-w-sm mx-auto">
          We encountered an error. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#1a6b4a] text-white font-bold uppercase tracking-wide px-6 py-3 text-sm hover:bg-[#145c3d] transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="border border-[#0f0e0c] text-[#0f0e0c] font-bold uppercase tracking-wide px-6 py-3 text-sm hover:bg-[#f3f1ec] transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
