export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
      <div className="text-center px-6">
        <div className="text-6xl mb-6">🏠</div>
        <h2 className="font-serif text-3xl text-[#0f0e0c] mb-3">
          Page not found
        </h2>
        <p className="text-[#87837c] text-sm mb-8">
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          className="bg-[#1a6b4a] text-white font-bold uppercase tracking-wide px-6 py-3 text-sm hover:bg-[#145c3d] transition-colors"
        >
          Browse properties
        </a>
      </div>
    </div>
  )
}
