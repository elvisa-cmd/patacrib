'use client'
import { useState, useCallback, useRef } from 'react'

interface Coords {
  lat:      number
  lng:      number
  accuracy: number
}

interface UseGeoLocationReturn {
  coords:  Coords | null
  error:   string | null
  loading: boolean
  capture: () => void
  clear:   () => void
}

export function useGeoLocation(): UseGeoLocationReturn {
  const [coords,  setCoords]  = useState<Coords | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const watchRef  = useRef<number | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopWatch = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const capture = useCallback(() => {
    stopWatch()
    setError(null)
    setCoords(null)
    setLoading(true)

    if (!navigator.geolocation) {
      setError('GPS not supported on this device.')
      setLoading(false)
      return
    }

    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!isSecure) {
      setError('GPS requires a secure connection (HTTPS).')
      setLoading(false)
      return
    }

    const startWatch = () => {
      let bestAccuracy = Infinity
      let bestCoords:   Coords | null = null

      watchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords

          if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy
            bestCoords   = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) }
            setCoords(bestCoords)
          }

          if (accuracy <= 20) {
            stopWatch()
            setLoading(false)
          }
        },
        (err) => {
          stopWatch()
          switch (err.code) {
            case 1:
              setError('Location access denied. Please allow location in browser settings.')
              break
            case 2:
              setError('Location unavailable. Please try outdoors.')
              break
            case 3:
              setError('Location timed out. Try again outdoors.')
              break
            default:
              setError('Could not get your location. Please try again.')
          }
          setLoading(false)
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      )

      // Hard cap — accept best result after 15 seconds
      timerRef.current = setTimeout(() => {
        stopWatch()
        if (bestCoords) setCoords(bestCoords)
        setLoading(false)
      }, 15000)
    }

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then(perm => {
          if (perm.state === 'denied') {
            setError(
              'Location access is blocked. Click the lock icon 🔒 in the address bar → Site settings → Location → Allow.'
            )
            setLoading(false)
          } else {
            startWatch()
          }
        })
        .catch(() => startWatch())
    } else {
      startWatch()
    }
  }, [stopWatch])

  const clear = useCallback(() => {
    stopWatch()
    setCoords(null)
    setError(null)
    setLoading(false)
  }, [stopWatch])

  return { coords, error, loading, capture, clear }
}
