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
  distKm: string   // "1.4km" or "350m"
  walkMin: number
  matatuMin: number
  driveMin: number
  rawKm: number
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
  const rawKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return {
    distKm:    rawKm < 1 ? `${Math.round(rawKm * 1000)}m` : `${rawKm.toFixed(1)}km`,
    walkMin:   Math.max(1, Math.round((rawKm / 4) * 60)),
    matatuMin: Math.max(2, Math.round((rawKm / 25) * 60)),
    driveMin:  Math.max(1, Math.round((rawKm / 30) * 60)),
    rawKm,
  }
}

export function openDirections(lat: number, lng: number, label: string = 'Property'): void {
  const ua        = navigator.userAgent
  const isIOS     = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  const dest      = `${lat},${lng}`

  if (isIOS) {
    // Try Google Maps deep link first; if not installed, fall back to Apple Maps
    window.location.href = `comgooglemaps://?daddr=${dest}&directionsmode=driving`
    setTimeout(() => {
      window.location.href = `maps://maps.apple.com/?daddr=${dest}&dirflg=d`
    }, 300)
  } else if (isAndroid) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
      '_blank'
    )
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${dest}` +
        `&destination_place_id=${encodeURIComponent(label)}&travelmode=driving`,
      '_blank'
    )
  }
}

export function openWalkingDirections(lat: number, lng: number): void {
  const ua    = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)

  if (isIOS) {
    window.location.href = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
      '_blank'
    )
  }
}
