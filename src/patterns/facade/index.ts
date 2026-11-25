import { lazy } from 'react'
import { definePattern } from '../define'
import { facadeCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const facade = definePattern({
  id: 'facade',
  category: 'structural',
  icon: '🏛️',
  content: { en, bn },
  code: facadeCode,
  Visual: lazy(() => import('./Visual')),
})
