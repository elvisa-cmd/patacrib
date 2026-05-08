export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60)     return 'Just now'
  if (seconds < 3600)   return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 172800) return 'Yesterday'
  return new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

export interface DirectionStep {
  instruction: string
  distance: string
  arrow: string
}

export interface RouteEstimate {
  distKm:     string   // "1.4km" or "350m"
  distMetres: number
  walkMin:    number
  matatuMin:  number
  driveMin:   number
  rawKm:      number
}

/** Haversine distance + travel time estimates. Pure function — no side effects. */
export function calculateRoute(
  from: [number, number],
  to: [number, number]
): RouteEstimate {
  const R = 6371
  const dLat = ((to[0] - from[0]) * Math.PI) / 180
  const dLon = ((to[1] - from[1]) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from[0] * Math.PI) / 180) *
      Math.cos((to[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const rawKm     = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distMetres = Math.round(rawKm * 1000)

  return {
    distKm:     rawKm < 1 ? `${distMetres}m` : `${rawKm.toFixed(1)}km`,
    distMetres,
    walkMin:    Math.max(1, Math.round((rawKm / 4) * 60)),
    matatuMin:  Math.max(2, Math.round((rawKm / 25) * 60)),
    driveMin:   Math.max(1, Math.round((rawKm / 30) * 60)),
    rawKm,
  }
}

