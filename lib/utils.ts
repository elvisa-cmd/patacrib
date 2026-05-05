export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60)     return 'Just now'
  if (seconds < 3600)   return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 172800) return 'Yesterday'
  return new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

export function openDirections(lat: number, lng: number, label: string): void {
  const ua      = navigator.userAgent
  const isIOS   = /iPad|iPhone|iPod/.test(ua)

  if (isIOS) {
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`, '_blank')
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}&travelmode=driving`,
      '_blank'
    )
  }
}

export function openWalkingDirections(lat: number, lng: number): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  if (isIOS) {
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`, '_blank')
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
      '_blank'
    )
  }
}
