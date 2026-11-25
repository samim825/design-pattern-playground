import { lazy } from 'react'
import { definePattern } from '../define'
import { bridgeCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const bridge = definePattern({
  id: 'bridge',
  category: 'structural',
  icon: '🌉',
  content: { en, bn },
  code: bridgeCode,
  Visual: lazy(() => import('./Visual')),
})
