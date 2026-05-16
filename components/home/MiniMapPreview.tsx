'use client'
import Link from 'next/link'

interface Props {
  count:      number
  avgPrice:   number
  tourCount:  number
  properties?: Array<{
    id:      string
    price:   number
    estate?: string | null
    city?:   string | null
  }>
}

export default function MiniMapPreview({ count, avgPrice, tourCount, properties }: Props) {
  return (
    <div style={{ padding: '0 12px', marginBottom: '16px' }}>

      {/* Section header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '10px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f0e0c', letterSpacing: '-0.3px' }}>
          Properties near you
        </div>
        <Link href="/browse/map" style={{
          fontSize:       '11px',
          color:          '#1a6b4a',
          fontWeight:     600,
          textDecoration: 'none',
          display:        'flex',
          alignItems:     'center',
          gap:            '3px',
        }}>
          Full map
          <svg width="12" height="12" fill="none" stroke="#1a6b4a" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Map preview card */}
      <Link href="/browse/map" style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          height:       '140px',
          borderRadius: '18px',
          overflow:     'hidden',
          background:   '#e8ede8',
          position:     'relative',
          marginBottom: '10px',
        }}>
          {/* Grid lines */}
          <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }} />

          {/* Roads */}
          <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.75)', borderRadius: '2px' }} />
          <div style={{ position: 'absolute', left: '44%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.75)', borderRadius: '2px' }} />

          {/* Heatmap glows */}
          <div style={{ position: 'absolute', width: '70px', height: '70px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,107,74,0.22) 0%,transparent 70%)', top: '15%', left: '38%' }} />
          <div style={{ position: 'absolute', width: '50px', height: '50px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,107,74,0.16) 0%,transparent 70%)', top: '50%', left: '12%' }} />
          <div style={{ position: 'absolute', width: '45px', height: '45px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(26,107,74,0.14) 0%,transparent 70%)', top: '25%', left: '65%' }} />

          {/* Price pins — real data */}
          {properties && properties.slice(0, 3).map((p, i) => {
            const positions = [
              { top: '12%', left: '40%' },
              { top: '48%', left: '12%' },
              { top: '22%', left: '66%' },
            ]
            const pos     = positions[i]
            const isFirst = i === 0
            return (
              <div key={p.id} style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%,-100%)' }}>
                <div style={{
                  background:   isFirst ? '#0f0e0c' : 'rgba(255,255,255,0.95)',
                  color:        isFirst ? '#fff'    : '#1a6b4a',
                  fontSize:     '9px',
                  fontWeight:   700,
                  padding:      '3px 8px',
                  borderRadius: '20px',
                  whiteSpace:   'nowrap',
                  boxShadow:    '0 2px 8px rgba(0,0,0,0.15)',
                }}>
                  KSh {Math.round(p.price / 1000)}K
                </div>
              </div>
            )
          })}

          {/* Stats pill */}
          <div style={{
            position:   'absolute',
            top:        '10px',
            left:       '10px',
            background: 'rgba(15,14,12,0.88)',
            borderRadius:'12px',
            padding:    '6px 12px',
            display:    'flex',
            gap:        '10px',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px' }}>listings</div>
            </div>
            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {avgPrice > 0 ? `${Math.round(avgPrice / 1000)}K` : '—'}
              </div>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px' }}>avg</div>
            </div>
          </div>

          {/* Open map button */}
          <div style={{
            position:     'absolute',
            bottom:       '10px',
            left:         '50%',
            transform:    'translateX(-50%)',
            background:   '#1a6b4a',
            color:        '#fff',
            fontSize:     '11px',
            fontWeight:   700,
            padding:      '7px 18px',
            borderRadius: '20px',
            whiteSpace:   'nowrap',
            display:      'flex',
            alignItems:   'center',
            gap:          '5px',
            boxShadow:    '0 4px 12px rgba(26,107,74,0.3)',
          }}>
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4M9 7l6-3"/>
            </svg>
            Open full map
          </div>
        </div>
      </Link>

      {/* Quick stats row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 '8px',
      }}>
        {[
          { n: count,    l: 'Listings' },
          { n: tourCount, l: 'With tours' },
          { n: avgPrice > 0 ? `${Math.round(avgPrice / 1000)}K` : '—', l: 'Avg price' },
        ].map((s, i) => (
          <div key={i} style={{
            background:   '#fff',
            border:       '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px',
            padding:      '10px 8px',
            textAlign:    'center',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a6b4a', marginBottom: '2px' }}>
              {s.n}
            </div>
            <div style={{ fontSize: '10px', color: '#b0a898', fontWeight: 500 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
