import { useState, useEffect, useCallback } from 'react'

export function useCarousel(
  totalItems: number,
  visibleCount = 3,
  autoPlayMs  = 4000,
) {
  const totalSlides = Math.max(1, totalItems - (visibleCount - 1))
  const [current,  setCurrent]  = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const goTo = useCallback((index: number) => {
    setCurrent(Math.max(0, Math.min(totalSlides - 1, index)))
  }, [totalSlides])

  const next = useCallback(() => {
    setCurrent(c => (c >= totalSlides - 1 ? 0 : c + 1))
  }, [totalSlides])

  const prev = useCallback(() => {
    setCurrent(c => (c <= 0 ? totalSlides - 1 : c - 1))
  }, [totalSlides])

  // Restart interval on every slide change so manual nav resets the 4s timer
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return
    const id = setInterval(next, autoPlayMs)
    return () => clearInterval(id)
  }, [isPaused, current, next, totalSlides, autoPlayMs])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [next, prev])

  return { current, goTo, next, prev, isPaused, setIsPaused, totalSlides }
}
