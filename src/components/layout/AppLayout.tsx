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
    <div className="min-h-screen bg-paper">
      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-[70px] hidden h-[calc(100vh-70px)] w-76 shrink-0 overflow-y-auto border-r-2 border-edge bg-paper-deep lg:block">
          <Sidebar />
        </aside>

        <main className="bg-motif min-h-[calc(100vh-70px)] min-w-0 flex-1">
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
              className="absolute inset-0 bg-[#2b1d16]/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.patterns')}
              className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r-2 border-edge bg-paper-deep"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b-4 border-chili bg-bottle px-4 text-cream">
                <span className="font-display text-lg font-bold">{t('nav.patterns')}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t('nav.closeMenu')}
                  autoFocus
                  className="grid size-9 place-items-center rounded-lg text-xl hover:bg-cream/10"
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
