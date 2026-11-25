import { lazy } from 'react'
import { definePattern } from '../define'
import { flyweightCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const flyweight = definePattern({
  id: 'flyweight',
  category: 'structural',
  icon: '🪶',
  content: { en, bn },
  code: flyweightCode,
  Visual: lazy(() => import('./Visual')),
})
