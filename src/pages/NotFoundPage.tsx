import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-6xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{t('notFound.title')}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">{t('notFound.body')}</p>
      <Link to="/" className="mt-6 inline-block font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        ← {t('notFound.back')}
      </Link>
    </div>
  )
}
