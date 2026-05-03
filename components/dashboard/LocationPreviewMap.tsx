import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./LocationPreviewMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="bg-surface2 flex items-center justify-center"
      style={{ height: '200px' }}
    >
      <p className="font-sans text-[11px] text-muted">Loading map…</p>
    </div>
  ),
})

export default function LocationPreviewMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="border border-border overflow-hidden">
      <Inner lat={lat} lng={lng} />
    </div>
  )
}
