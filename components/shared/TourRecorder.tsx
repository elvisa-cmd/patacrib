'use client'
import { useEffect, useRef, useState } from 'react'

type RecordingState = 'idle' | 'countdown' | 'recording' | 'preview' | 'uploading' | 'done'

interface Props {
  onUpload: (videoUrl: string) => void
  propertyId?: string
}

export default function TourRecorder({ onUpload, propertyId }: Props) {
  const videoRef          = useRef<HTMLVideoElement>(null)
  const previewRef        = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const streamRef         = useRef<MediaStream | null>(null)
  const chunksRef         = useRef<Blob[]>([])
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state,       setState]      = useState<RecordingState>('idle')
  const [countdown,   setCountdown]  = useState(3)
  const [duration,    setDuration]   = useState(0)
  const [previewUrl,  setPreviewUrl] = useState<string | null>(null)
  const [error,       setError]      = useState<string | null>(null)
  const [facingMode,  setFacingMode] = useState<'environment' | 'user'>('environment')
  const MAX_DURATION = 120

  async function startCamera(facing: 'environment' | 'user' = facingMode) {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.play()
      }
      setError(null)
    } catch (err: unknown) {
      const name = (err as { name?: string }).name
      if (name === 'NotAllowedError') {
        setError('Camera permission denied. Enable camera access in browser settings.')
      } else if (name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Could not access camera. Please try again.')
      }
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function flipCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  function startCountdown() {
    setState('countdown')
    setCountdown(3)
    let count = 3
    const interval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        startRecording()
      }
    }, 1000)
  }

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    setDuration(0)

    const mimeType = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url  = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setState('preview')
      if (previewRef.current) {
        previewRef.current.src   = url
        previewRef.current.muted = true
      }
    }

    recorder.start(1000)
    setState('recording')

    let secs = 0
    timerRef.current = setInterval(() => {
      secs += 1
      setDuration(secs)
      if (secs >= MAX_DURATION) stopRecording()
    }, 1000)
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function retake() {
    setPreviewUrl(null)
    setDuration(0)
    setState('idle')
    startCamera()
  }

  async function uploadTour() {
    if (!previewUrl) return
    setState('uploading')

    try {
      const blob = new Blob(chunksRef.current, {
        type: chunksRef.current[0]?.type || 'video/webm',
      })
      const file = new File([blob], `tour-${Date.now()}.webm`, { type: blob.type })

      const formData = new FormData()
      formData.append('file', file)
      if (propertyId) formData.append('propertyId', propertyId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const errData = await res.json() as { error?: string }
        throw new Error(errData.error || 'Upload failed')
      }

      const data     = await res.json() as { url?: string; videoUrl?: string; secure_url?: string }
      const videoUrl = data.url || data.videoUrl || data.secure_url
      if (!videoUrl) throw new Error('No URL returned from server')

      setState('done')
      onUpload(videoUrl)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      console.error('Tour upload error:', message)
      setError('Upload failed: ' + message)
      setState('preview')
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (error) return (
    <div style={{ padding: '20px', background: 'rgba(220,38,38,0.08)', borderRadius: '12px', color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>Camera unavailable</div>
      <div style={{ color: '#6b6055' }}>{error}</div>
    </div>
  )

  if (state === 'done') return (
    <div style={{ padding: '20px', background: 'rgba(26,107,74,0.08)', borderRadius: '12px', color: '#1a6b4a', fontSize: '13px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
      <div style={{ fontWeight: 600 }}>Virtual tour uploaded successfully</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Camera / preview viewport */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>

        {state !== 'preview' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {state === 'preview' && previewUrl && (
          <video
            ref={previewRef}
            src={previewUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {state === 'countdown' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '80px', fontWeight: 700, color: '#fff', animation: 'pop 0.5s ease' }}>
              {countdown}
            </div>
          </div>
        )}

        {state === 'recording' && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.6)', borderRadius: '20px', padding: '4px 12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'blink 1s ease infinite' }} />
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>
              {formatTime(duration)} / {formatTime(MAX_DURATION)}
            </span>
          </div>
        )}

        {state === 'recording' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)' }}>
            <div style={{ height: '100%', background: '#dc2626', width: `${(duration / MAX_DURATION) * 100}%`, transition: 'width 1s linear' }} />
          </div>
        )}

        {(state === 'idle' || state === 'recording') && (
          <button
            onClick={flipCamera}
            style={{ position: 'absolute', top: '12px', right: '12px', width: '36px', height: '36px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            🔄
          </button>
        )}
      </div>

      {state === 'idle' && (
        <div style={{ fontSize: '12px', color: '#6b6055', textAlign: 'center', lineHeight: 1.6 }}>
          Walk through the property slowly. Max 2 minutes.<br />
          No audio recorded — clean silent tour for renters.
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {state === 'idle' && (
          <button
            onClick={startCountdown}
            style={{ flex: 1, padding: '14px', background: '#1a6b4a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            🎬 Start recording tour
          </button>
        )}

        {state === 'recording' && (
          <button
            onClick={stopRecording}
            style={{ flex: 1, padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            ⏹ Stop recording
          </button>
        )}

        {state === 'preview' && (
          <>
            <button
              onClick={retake}
              style={{ flex: 1, padding: '14px', background: 'rgba(0,0,0,0.06)', color: '#0f0e0c', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              🔁 Retake
            </button>
            <button
              onClick={uploadTour}
              style={{ flex: 2, padding: '14px', background: '#1a6b4a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              ✅ Use this tour
            </button>
          </>
        )}

        {state === 'uploading' && (
          <div style={{ flex: 1, padding: '14px', background: 'rgba(26,107,74,0.1)', color: '#1a6b4a', borderRadius: '12px', fontSize: '14px', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #1a6b4a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Uploading tour...
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pop   { 0% { transform:scale(1.5); opacity:0 } 100% { transform:scale(1); opacity:1 } }
        @keyframes spin  { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}
