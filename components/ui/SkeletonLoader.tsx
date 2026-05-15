export default function SkeletonLoader() {
  return (
    <div style={{ padding: '0', background: '#faf8f5', minHeight: '100vh' }}>
      {/* Nav skeleton */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf8f5' }}>
        <div className="skeleton" style={{ width: '90px', height: '20px' }} />
        <div className="skeleton" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
      </div>
      {/* Greeting skeleton */}
      <div style={{ padding: '8px 16px 12px' }}>
        <div className="skeleton" style={{ width: '120px', height: '12px', marginBottom: '6px' }} />
        <div className="skeleton" style={{ width: '180px', height: '20px' }} />
      </div>
      {/* Search skeleton */}
      <div style={{ margin: '0 16px 12px' }}>
        <div className="skeleton" style={{ height: '44px', borderRadius: '14px' }} />
      </div>
      {/* Pills skeleton */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 12px' }}>
        {[60, 80, 60, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}px`, height: '28px', borderRadius: '20px', flexShrink: 0 }} />
        ))}
      </div>
      {/* Cards skeleton */}
      <div style={{ display: 'flex', gap: '10px', padding: '0 16px 14px', overflow: 'hidden' }}>
        {[1, 2].map(i => (
          <div key={i} className="skeleton" style={{ width: '165px', height: '160px', borderRadius: '16px', flexShrink: 0 }} />
        ))}
      </div>
      {/* CTA skeleton */}
      <div style={{ margin: '0 16px' }}>
        <div className="skeleton" style={{ height: '64px', borderRadius: '16px' }} />
      </div>
    </div>
  )
}
