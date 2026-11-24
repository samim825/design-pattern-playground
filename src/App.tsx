import { MotionConfig } from 'framer-motion'
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PatternRoute } from './pages/PatternRoute'
import './i18n'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="patterns/:id" element={<PatternRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}
