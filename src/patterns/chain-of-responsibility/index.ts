import { lazy } from 'react'
import { definePattern } from '../define'
import { chainCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const chainOfResponsibility = definePattern({
  id: 'chain-of-responsibility',
  category: 'behavioral',
  icon: '⛓️',
  content: { en, bn },
  code: chainCode,
  Visual: lazy(() => import('./Visual')),
})
