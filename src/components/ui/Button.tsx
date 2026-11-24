import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-600/50 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
