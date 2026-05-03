import { timeAgo } from '@/lib/utils'

interface MessageBubbleProps {
  content:        string
  createdAt:      string
  isMine:         boolean
  senderName:     string | null
  showSenderName: boolean
  showTime:       boolean
  read:           boolean
}

export default function MessageBubble({
  content,
  createdAt,
  isMine,
  senderName,
  showSenderName,
  showTime,
  read,
}: MessageBubbleProps) {
  return (
    <div className={`flex flex-col mb-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
      {showSenderName && !isMine && senderName && (
        <p className="font-sans text-[10px] text-muted mb-1 ml-1">{senderName}</p>
      )}
      <div
        className={`max-w-[68%] px-3.5 py-2.5 ${
          isMine
            ? 'bg-accent text-white'
            : 'bg-surface border border-border text-ink'
        }`}
        style={{
          borderRadius: isMine
            ? '12px 12px 0 12px'
            : '12px 12px 12px 0',
        }}
      >
        <p className="font-sans text-[13px] leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>
      {showTime && (
        <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <p className="font-sans text-[9px] text-muted2">
            {timeAgo(new Date(createdAt))}
          </p>
          {isMine && (
            <span className="font-sans text-[9px] text-muted2">
              {read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
