import { lazy } from 'react'
import { definePattern } from '../define'
import { mediatorCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const mediator = definePattern({
  id: 'mediator',
  category: 'behavioral',
  icon: '🤝',
  content: { en, bn },
  code: mediatorCode,
  Visual: lazy(() => import('./Visual')),
})
