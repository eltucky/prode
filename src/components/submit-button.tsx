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
      className={[className, pending ? 'opacity-60 cursor-not-allowed' : ''].filter(Boolean).join(' ')}
    >
      {pending ? (
        <>
          <svg
            aria-hidden="true"
            className="animate-spin h-3 w-3 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="sr-only">Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
