'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const PannellumViewer = dynamic(() => import('./PannellumViewer'), { ssr: false })

interface VirtualTourProps {
  videoUrl?:    string | null
  tourImageUrl?: string | null
  propertyTitle: string
}

export function VirtualTour({ videoUrl, tourImageUrl, propertyTitle }: VirtualTourProps) {
  const [activeTab, setActiveTab] = useState<'video' | '360'>(videoUrl ? 'video' : '360')

  if (!videoUrl && !tourImageUrl) return null

  return (
    <div className="bg-white border border-border mt-6">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent flex items-center justify-center">
            <span className="text-white text-sm">🎥</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-ink">Virtual Tour</h3>
            <p className="text-xs text-muted">Explore this property from anywhere</p>
          </div>
        </div>

        {/* Tab switcher — only shown when both types are present */}
        {videoUrl && tourImageUrl && (
          <div className="flex border border-border overflow-hidden">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                activeTab === 'video' ? 'bg-accent text-white' : 'text-muted hover:bg-surface2'
              }`}
            >
              🎥 Video
            </button>
            <button
              onClick={() => setActiveTab('360')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-l border-border transition-colors ${
                activeTab === '360' ? 'bg-accent text-white' : 'text-muted hover:bg-surface2'
              }`}
            >
              360°
            </button>
          </div>
        )}
      </div>

      {/* Video tour */}
      {activeTab === 'video' && videoUrl && (
        <div className="relative bg-black aspect-video">
          <video controls className="w-full h-full" preload="metadata">
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            Your browser does not support video playback.
          </video>
          <button
            onClick={() => {
              const video = document.querySelector('video')
              video?.requestFullscreen()
            }}
            className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 hover:bg-black/80 transition-colors"
          >
            ⛶ Fullscreen
          </button>
        </div>
      )}

      {/* 360° tour */}
      {activeTab === '360' && tourImageUrl && (
        <div className="relative" style={{ height: '400px' }}>
          <PannellumViewer imageUrl={tourImageUrl} title={propertyTitle} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 pointer-events-none flex items-center gap-2">
            <span>🖱</span>
            Drag to look around · Scroll to zoom
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-surface flex items-center justify-between">
        <p className="text-xs text-muted">
          {activeTab === 'video' ? '🎥 Video walkthrough by landlord' : '360° Interactive photo tour'}
        </p>
        <p className="text-xs text-accent font-bold">📍 GPS verified property</p>
      </div>
    </div>
  )
}
