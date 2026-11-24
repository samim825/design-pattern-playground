import type { ReactNode } from 'react'

export function Section({
  id,
  number,
  title,
  children,
  className = '',
}: {
  id: string
  number?: number
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`min-w-0 scroll-mt-24 ${className}`}>
      <h2 id={`${id}-title`} className="mb-4 flex items-center gap-3 font-display text-2xl font-bold text-ink">
        {number !== undefined && (
          <span className="grid size-9 shrink-0 rotate-[-4deg] place-items-center rounded-lg border-2 border-edge bg-mustard font-display text-lg font-extrabold text-on-accent shadow-hard-sm">
            {number}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Outlined card with a hard offset shadow. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border-2 border-edge bg-card shadow-hard ${className}`}>{children}</div>
}

/** Card with a coloured title bar, like "FIELD NOTE · STUDY THIS FIRST". */
export function BarCard({
  label,
  icon,
  tone = 'mustard',
  children,
  className = '',
  bodyClassName = 'p-5',
}: {
  label: ReactNode
  icon?: ReactNode
  tone?: 'mustard' | 'bottle' | 'chili' | 'maroon'
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  const bar = {
    mustard: 'bg-mustard text-on-accent',
    bottle: 'bg-bottle text-cream',
    chili: 'bg-chili text-cream',
    maroon: 'bg-maroon text-cream',
  }[tone]
  return (
    <div className={`overflow-hidden rounded-xl border-2 border-edge bg-card shadow-hard ${className}`}>
      <div className={`flex items-center gap-2 border-b-2 border-edge px-4 py-2 label-caps ${bar}`}>
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
