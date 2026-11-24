import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from '../ErrorBoundary'
import { CloseIcon } from '../ui/icons'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const close = () => setDrawerOpen(false)

  // Mobile drawer: close on Escape and lock page scroll while open.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [drawerOpen])

  return (
    <div className="min-h-screen">
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-slate-200 lg:block dark:border-slate-800">
          <Sidebar />
        </aside>

        <main className="min-w-0 flex-1">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.patterns')}
              className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-xl dark:bg-slate-900"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">{t('nav.patterns')}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t('nav.closeMenu')}
                  autoFocus
                  className="grid size-9 place-items-center rounded-lg text-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="overflow-y-auto">
                <Sidebar onNavigate={close} />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
