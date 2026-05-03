'use client'

import { useState } from 'react'

interface FloatingInputProps {
  label:      string
  id?:        string
  type?:      string
  value:      string
  onChange:   (v: string) => void
  helper?:    string
  error?:     string
  rightNode?: React.ReactNode
  optional?:  boolean
  autoComplete?: string
  required?:  boolean
}

export function FloatingInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  helper,
  error,
  rightNode,
  optional,
  autoComplete,
  required,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false)
  const isActive = focused || value.length > 0

  const labelColor = error
    ? '#ef4444'
    : isActive
    ? '#1a6b4a'
    : '#87837c'

  const borderColor = error
    ? '#ef4444'
    : isActive
    ? '#1a6b4a'
    : '#e5e1d8'

  return (
    <div className="relative">

      {/* Input wrapper */}
      <div
        className="relative transition-colors duration-300"
        style={{ borderBottom: `2px solid ${borderColor}` }}
      >

        {/* Floating label */}
        <label
          htmlFor={id}
          className="absolute left-0 pointer-events-none font-sans font-semibold transition-all duration-300"
          style={{
            top:           isActive ? '0px'  : '18px',
            fontSize:      isActive ? '9px'  : '14px',
            letterSpacing: isActive ? '1.5px': '0',
            textTransform: isActive ? 'uppercase' : 'none',
            color:         labelColor,
          }}
        >
          {label}
          {optional && (
            <span
              className="ml-1 normal-case font-normal"
              style={{ fontSize: '10px', letterSpacing: 0, color: '#b5b1aa' }}
            >
              (optional)
            </span>
          )}
        </label>

        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          required={required}
          placeholder=""
          className="w-full bg-transparent font-sans text-[14px] text-ink outline-none"
          style={{
            paddingTop:    '24px',
            paddingBottom: '8px',
            paddingRight:  rightNode ? '36px' : '0',
          }}
        />

        {/* Right node (eye icon, checkmark, etc.) */}
        {rightNode && (
          <div className="absolute right-0 bottom-2 flex items-center">
            {rightNode}
          </div>
        )}

        {/* Animated underline */}
        <div
          className="absolute bottom-0 left-0 h-[2px] transition-all duration-300"
          style={{
            width:      isActive ? '100%' : '0%',
            background: error ? '#ef4444' : '#1a6b4a',
            marginBottom: '-2px',
          }}
        />
      </div>

      {/* Helper / error */}
      {(helper || error) && (
        <p
          className="mt-1.5 font-sans"
          style={{ fontSize: '10px', color: error ? '#ef4444' : '#b5b1aa' }}
        >
          {error || helper}
        </p>
      )}
    </div>
  )
}
