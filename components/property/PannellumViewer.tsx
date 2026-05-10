'use client'

import { useEffect, useRef } from 'react'

interface Props {
  imageUrl: string
  title:    string
}

export default function PannellumViewer({ imageUrl, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).pannellum) {
        const link  = document.createElement('link')
        link.rel    = 'stylesheet'
        link.href   = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'
        document.head.appendChild(link)

        await new Promise<void>(resolve => {
          const script  = document.createElement('script')
          script.src    = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      viewerRef.current = (window as any).pannellum.viewer(containerRef.current, {
        type:               'equirectangular',
        panorama:           imageUrl,
        autoLoad:           true,
        autoRotate:         -2,
        compass:            false,
        showFullscreenCtrl: true,
        showZoomCtrl:       true,
        mouseZoom:          true,
        title,
        hfov:    100,
        minHfov: 50,
        maxHfov: 150,
      })
    }

    load()

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [imageUrl, title])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  )
}
