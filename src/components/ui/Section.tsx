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
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 ${className}`}>
      <h2 id={`${id}-title`} className="mb-4 flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white">
        {number !== undefined && (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white dark:bg-indigo-500">
            {number}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}
