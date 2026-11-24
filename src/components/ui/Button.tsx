import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

// "Printed sticker" buttons: thick outline + hard shadow that presses in on click.
const pressable =
  'border-2 border-edge shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:translate-0 disabled:shadow-none'

const variants: Record<Variant, string> = {
  primary: `${pressable} bg-mustard text-on-accent hover:brightness-105 disabled:opacity-50`,
  secondary: `${pressable} bg-card text-ink hover:bg-paper disabled:opacity-50`,
  ghost: 'border-2 border-transparent text-ink-soft hover:text-ink hover:bg-ink/5 disabled:opacity-40',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-[transform,box-shadow,background-color,filter] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
