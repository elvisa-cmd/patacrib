interface FormInputProps {
  label:         string
  id:            string
  type?:         string
  placeholder?:  string
  value:         string
  onChange:      (v: string) => void
  error?:        string
  success?:      string
  hint?:         string
  optional?:     boolean
  autoComplete?: string
  rightNode?:    React.ReactNode
  required?:     boolean
}

export default function FormInput({
  label, id, type = 'text', placeholder, value, onChange,
  error, success, hint, optional, autoComplete, rightNode, required,
}: FormInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-sans font-semibold text-[9px] uppercase tracking-[1px] text-ink mb-1.5"
      >
        {label}
        {optional && (
          <span className="font-sans font-normal normal-case tracking-normal text-muted ml-1.5">
            (optional)
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className={[
            'w-full border-[1.5px] px-4 py-3 font-sans text-[13px] text-ink bg-white',
            'placeholder:text-muted2 outline-none transition-colors',
            'focus:border-accent focus:ring-[3px] focus:ring-accent/10',
            rightNode ? 'pr-10' : '',
            error ? 'border-red' : 'border-border2',
          ].filter(Boolean).join(' ')}
        />
        {rightNode && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightNode}
          </div>
        )}
      </div>
      {error && (
        <p className="font-sans text-[10px] text-red mt-1">{error}</p>
      )}
      {success && !error && (
        <p className="font-sans text-[10px] text-accent mt-1">{success}</p>
      )}
      {hint && !error && !success && (
        <p className="font-sans text-[10px] text-muted mt-1">{hint}</p>
      )}
    </div>
  )
}
