'use client'

interface Props {
  waterSchedule:   string | null
  waterSource:     string | null
  borehole:        boolean
  matatuRoutes:    string[]
  nearestStage:    string | null
  safetyScore:     number | null
  safetyLevel:     string | null
  powerBackup:     boolean
  internetOptions: string[]
  petsAllowed:     boolean
  smokingAllowed:  boolean
  parkingSpaces:   number
  furnished:       string | null
  availableFrom:   string | null
  depositMonths:   number
  areaAvgRent:     number | null
  price:           number
}

function Row({ icon, label, value, highlight }: {
  icon: string; label: string; value: string; highlight?: boolean
}) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      padding:        '10px 0',
      borderBottom:   '1px solid rgba(15,14,12,0.06)',
    }}>
      <span style={{ fontSize: '16px', width: '22px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '12px', color: '#6b6055', flex: 1 }}>{label}</span>
      <span style={{
        fontSize:     '12px',
        fontWeight:   600,
        color:        highlight ? '#1a6b4a' : '#0f0e0c',
        background:   highlight ? 'rgba(26,107,74,0.08)' : 'transparent',
        padding:      highlight ? '2px 8px' : '0',
        borderRadius: highlight ? '20px' : '0',
      }}>
        {value}
      </span>
    </div>
  )
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '4px 10px',
      borderRadius: '20px',
      fontSize:     '11px',
      fontWeight:   600,
      background:   ok ? 'rgba(26,107,74,0.1)' : 'rgba(107,96,85,0.08)',
      color:        ok ? '#1a6b4a' : '#6b6055',
      border:       ok ? '1px solid rgba(26,107,74,0.2)' : '1px solid rgba(107,96,85,0.15)',
    }}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

export default function IntelligenceCard({
  waterSchedule, waterSource, borehole,
  matatuRoutes, nearestStage,
  safetyScore, safetyLevel,
  powerBackup,
  internetOptions,
  petsAllowed, smokingAllowed,
  parkingSpaces,
  furnished,
  availableFrom,
  depositMonths,
  areaAvgRent,
  price,
}: Props) {
  const depositAmount = depositMonths > 0 ? `KSh ${(price * depositMonths).toLocaleString('en-KE')} (${depositMonths}mo)` : 'None'

  const waterLabel = (() => {
    const parts: string[] = []
    if (waterSchedule) parts.push(waterSchedule)
    if (waterSource)   parts.push(waterSource)
    if (borehole)      parts.push('borehole')
    return parts.length ? parts.join(' · ') : 'Not specified'
  })()

  const matatuLabel = (() => {
    const parts: string[] = []
    if (matatuRoutes?.length) parts.push(matatuRoutes.slice(0, 3).join(', ') + (matatuRoutes.length > 3 ? ` +${matatuRoutes.length - 3}` : ''))
    if (nearestStage) parts.push(`Stage: ${nearestStage}`)
    return parts.length ? parts.join(' · ') : 'Not specified'
  })()

  const safetyLabel = (() => {
    const parts: string[] = []
    if (safetyScore != null) parts.push(`${safetyScore}/10`)
    if (safetyLevel) parts.push(safetyLevel)
    return parts.length ? parts.join(' · ') : 'Not rated'
  })()

  const availableLabel = (() => {
    if (!availableFrom) return 'Now'
    const d = new Date(availableFrom)
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  })()

  const vsMarket = areaAvgRent && price
    ? price < areaAvgRent
      ? `${Math.round(((areaAvgRent - price) / areaAvgRent) * 100)}% below area avg`
      : price > areaAvgRent
      ? `${Math.round(((price - areaAvgRent) / areaAvgRent) * 100)}% above area avg`
      : 'At area avg'
    : null

  return (
    <div style={{
      background:   '#fff',
      border:       '1px solid rgba(15,14,12,0.08)',
      borderRadius: '16px',
      padding:      '20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px' }}>🧠</span>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f0e0c', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
          Property Intelligence
        </h3>
      </div>

      <Row icon="💧" label="Water supply"     value={waterLabel}    highlight={!!waterSchedule || borehole} />
      <Row icon="🚌" label="Matatu access"    value={matatuLabel}   highlight={matatuRoutes?.length > 0} />
      <Row icon="🛡" label="Safety"           value={safetyLabel}   highlight={safetyScore != null && safetyScore >= 7} />
      <Row icon="⚡" label="Power backup"     value={powerBackup ? 'Generator / solar' : 'None'} highlight={powerBackup} />
      <Row icon="🅿" label="Parking"          value={parkingSpaces > 0 ? `${parkingSpaces} space${parkingSpaces > 1 ? 's' : ''}` : 'None'} highlight={parkingSpaces > 0} />
      <Row icon="🛋" label="Furnished"        value={furnished || 'Unfurnished'} />
      <Row icon="📅" label="Available from"   value={availableLabel} highlight={!availableFrom} />
      <Row icon="💰" label="Deposit required" value={depositAmount} />
      {areaAvgRent && (
        <Row icon="📊" label="Area avg rent"  value={`KSh ${areaAvgRent.toLocaleString('en-KE')}/mo`} />
      )}

      {vsMarket && (
        <div style={{
          marginTop:    '14px',
          padding:      '10px 14px',
          background:   price < (areaAvgRent ?? price) ? 'rgba(26,107,74,0.08)' : 'rgba(220,38,38,0.06)',
          borderRadius: '10px',
          fontSize:     '12px',
          fontWeight:   600,
          color:        price < (areaAvgRent ?? price) ? '#1a6b4a' : '#dc2626',
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
        }}>
          {price < (areaAvgRent ?? price) ? '🏷 Good deal —' : '📈'} {vsMarket}
        </div>
      )}

      {internetOptions?.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '11px', color: '#6b6055', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Internet options</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {internetOptions.map(opt => (
              <span key={opt} style={{
                padding:      '3px 10px',
                background:   'rgba(26,107,74,0.08)',
                border:       '1px solid rgba(26,107,74,0.15)',
                borderRadius: '20px',
                fontSize:     '11px',
                fontWeight:   600,
                color:        '#1a6b4a',
              }}>
                📶 {opt}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <Badge label="Pets allowed"    ok={petsAllowed} />
        <Badge label="Smoking allowed" ok={smokingAllowed} />
      </div>
    </div>
  )
}
