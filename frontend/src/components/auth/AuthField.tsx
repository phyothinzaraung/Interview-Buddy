import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  registration?: UseFormRegisterReturn
  trailing?: ReactNode
}

export default function AuthField({ label, error, registration, trailing, className = '', ...inputProps }: AuthFieldProps) {
  const generatedId = useId()
  const id = inputProps.id ?? generatedId
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <input
          {...inputProps}
          {...registration}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50 ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200'} ${trailing ? 'pr-12' : ''} ${className}`}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {error && <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
