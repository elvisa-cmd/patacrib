export default function PropertyNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center px-4">
        <div className="text-6xl mb-6" aria-hidden="true">🏠</div>
        <h1 className="font-serif text-[32px] text-ink mb-3">Property not found</h1>
        <p className="font-sans text-[14px] text-muted mb-8 max-w-[320px] mx-auto leading-relaxed">
          This listing may have been removed or is no longer available.
        </p>
        <a
          href="/browse"
          className="inline-block bg-accent text-white font-sans font-bold text-[13px] uppercase tracking-[0.8px] px-8 py-4 hover:bg-accent-d transition-colors"
        >
          Browse all listings
        </a>
      </div>
    </div>
  )
}
