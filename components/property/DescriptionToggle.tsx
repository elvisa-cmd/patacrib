'use client'

import { useState } from 'react'

const PREVIEW_LEN = 200

export default function DescriptionToggle({
  description,
}: {
  description: string
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = description.length > PREVIEW_LEN

  return (
    <div>
      <p className="font-sans font-light text-[14px] text-muted leading-[1.8]">
        {!expanded && isLong
          ? description.slice(0, PREVIEW_LEN) + '…'
          : description}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="font-sans font-medium text-[12px] text-accent hover:text-accent-d transition-colors mt-2"
        >
          {expanded ? 'Read less ←' : 'Read more →'}
        </button>
      )}
    </div>
  )
}
