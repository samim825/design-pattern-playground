import { lazy } from 'react'
import { definePattern } from '../define'
import { strategyCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const strategy = definePattern({
  id: 'strategy',
  category: 'behavioral',
  icon: '♟️',
  content: { en, bn },
  code: strategyCode,
  Visual: lazy(() => import('./Visual')),
})
