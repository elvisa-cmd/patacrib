import type { ReactNode } from 'react'

interface KenyaDetailsProps {
  waterSchedule: string | null
  matatuRoutes:  string[]
  safetyScore:   number | null
  powerBackup:   boolean
  borehole:      boolean
  amenities:     string[]
  address:       string
  latitude:      number
  longitude:     number
}

// Straight-line Haversine from Nairobi CBD — kept local, orthogonal to lib/geo
const NAIROBI_LAT = -1.2921
const NAIROBI_LNG =  36.8219

function distanceKm(lat2: number, lon2: number): number {
  const R    = 6371
  const dLat = ((lat2 - NAIROBI_LAT) * Math.PI) / 180
  const dLon = ((lon2 - NAIROBI_LNG) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((NAIROBI_LAT * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="font-sans font-medium text-[9px] uppercase tracking-[1.5px] text-muted2 pt-5 pb-2 border-t border-border">
      {children}
    </p>
  )
}

function InfoRow({
  emoji,
  label,
  value,
  isLast = false,
}: {
  emoji: string
  label: string
  value: ReactNode
  isLast?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{emoji}</span>
        <span className="font-sans text-[11px] text-muted">{label}</span>
      </div>
      <div className="font-sans font-bold text-[11px] text-ink">{value}</div>
    </div>
  )
}

function SafetyDots({ score }: { score: number }) {
  const filled = Math.round((score / 10) * 5)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < filled ? 'bg-accent' : 'bg-surface2'
          }`}
          style={i >= filled ? { border: '1px solid rgba(15,14,12,0.13)' } : {}}
        />
      ))}
      <span className="ml-1 font-sans text-[10px] text-muted">
        {score.toFixed(1)}/10
      </span>
    </div>
  )
}

function WaterBadge({ schedule }: { schedule: string | null }) {
  if (!schedule) {
    return <span className="text-muted font-normal">Not specified</span>
  }
  const isDaily =
    schedule.toLowerCase().includes('daily') ||
    schedule.toLowerCase().includes('24')
  return (
    <span
      className={`font-sans font-bold text-[10px] px-2 py-0.5 ${
        isDaily
          ? 'bg-green/10 text-green'
          : 'bg-gold/10 text-gold'
      }`}
    >
      {schedule}
    </span>
  )
}

export default function KenyaDetails({
  waterSchedule,
  matatuRoutes,
  safetyScore,
  powerBackup,
  borehole,
  amenities,
  latitude,
  longitude,
}: KenyaDetailsProps) {
  const distCBD = distanceKm(latitude, longitude)
  const walkMin = Math.max(1, Math.round((distCBD / 4) * 60))

  return (
    <div className="bg-surface border border-border px-4 py-1 mb-8">
      {/* ── Location & Transport ──────────────────────────────── */}
      <SectionTitle>📍 Location &amp; Transport</SectionTitle>

      <InfoRow emoji="🏙" label="Distance to CBD" value={`${distCBD.toFixed(1)} km`} />
      <InfoRow emoji="🚶" label="Walk to CBD"     value={`~${walkMin} min`} />
      <InfoRow
        emoji="🚌"
        label="Matatu routes"
        isLast
        value={
          matatuRoutes.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
              {matatuRoutes.map((r) => (
                <span
                  key={r}
                  className="bg-accent-l text-accent font-sans font-semibold text-[9px] px-2 py-0.5"
                >
                  {r}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted font-normal">Not listed</span>
          )
        }
      />

      {/* ── Utilities ────────────────────────────────────────── */}
      <SectionTitle>💧 Utilities</SectionTitle>

      <InfoRow
        emoji="💧"
        label="Water supply"
        value={<WaterBadge schedule={waterSchedule} />}
      />
      <InfoRow emoji="🕳"  label="Borehole"     value={borehole    ? 'Yes' : 'No'} />
      <InfoRow emoji="⚡"  label="Power backup" value={powerBackup ? 'Yes' : 'No'} isLast />

      {/* ── Safety ───────────────────────────────────────────── */}
      <SectionTitle>🔒 Safety</SectionTitle>

      <InfoRow
        emoji="🛡"
        label="Safety score"
        isLast
        value={
          safetyScore != null ? (
            <SafetyDots score={safetyScore} />
          ) : (
            <span className="text-muted font-normal">Not rated</span>
          )
        }
      />

      {/* ── Amenities ────────────────────────────────────────── */}
      {amenities.length > 0 && (
        <>
          <SectionTitle>🏪 Nearby amenities</SectionTitle>
          <div className="flex flex-wrap gap-1.5 py-3">
            {amenities.map((a) => (
              <span
                key={a}
                className="bg-accent-l text-accent font-sans font-medium text-[10px] uppercase tracking-[0.5px] px-3 py-1"
              >
                {a}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
