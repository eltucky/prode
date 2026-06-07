'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus()

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      className={`relative cursor-pointer disabled:cursor-wait ${className}`}
    >
      {children}
      {pending && (
        <span className="absolute inset-0 rounded-[inherit] ring-2 ring-current animate-pulse pointer-events-none" />
      )}
    </button>
  )
}
