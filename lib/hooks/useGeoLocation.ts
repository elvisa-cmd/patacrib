'use client'
import { useState, useCallback } from 'react'

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

  const capture = useCallback(async () => {
    setError(null)
    setCoords(null)
    setLoading(true)

    if (!navigator.geolocation) {
      setError('GPS is not supported by your browser. Please use Chrome or Firefox.')
      setLoading(false)
      return
    }

    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!isSecure) {
      setError('GPS requires a secure connection (HTTPS). Please contact support.')
      setLoading(false)
      return
    }

    // Check if permission was already denied — give actionable instructions immediately
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        if (permission.state === 'denied') {
          setError(
            'Location access is blocked. To fix: click the lock icon 🔒 in your browser address bar → Site settings → Location → Allow. Then refresh the page.'
          )
          setLoading(false)
          return
        }
      } catch {
        // permissions API not supported — proceed anyway
      }
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log('GPS captured:', { latitude, longitude, accuracy })
        setCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) })
        setLoading(false)
      },
      (err) => {
        console.error('GPS error:', err)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              'Location access was denied. Please allow location access in your browser settings and try again.'
            )
            break
          case err.POSITION_UNAVAILABLE:
            setError(
              'Your location is currently unavailable. Please move to an area with better GPS signal and try again.'
            )
            break
          case err.TIMEOUT:
            setError(
              'Location request timed out. Please try again outdoors for better GPS signal.'
            )
            break
          default:
            setError('Could not get your location. Please try again.')
        }
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge:         0,      // never use cached location
        timeout:            15000,
      }
    )
  }, [])

  const clear = useCallback(() => {
    setCoords(null)
    setError(null)
    setLoading(false)
  }, [])

  return { coords, error, loading, capture, clear }
}
