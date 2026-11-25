import { lazy } from 'react'
import { definePattern } from '../define'
import { decoratorCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const decorator = definePattern({
  id: 'decorator',
  category: 'structural',
  icon: '🎁',
  content: { en, bn },
  code: decoratorCode,
  Visual: lazy(() => import('./Visual')),
})
