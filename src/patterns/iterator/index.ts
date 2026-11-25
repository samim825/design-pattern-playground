import { lazy } from 'react'
import { definePattern } from '../define'
import { iteratorCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const iterator = definePattern({
  id: 'iterator',
  category: 'behavioral',
  icon: '🔁',
  content: { en, bn },
  code: iteratorCode,
  Visual: lazy(() => import('./Visual')),
})
