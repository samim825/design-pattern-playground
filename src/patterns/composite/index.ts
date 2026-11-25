import { lazy } from 'react'
import { definePattern } from '../define'
import { compositeCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const composite = definePattern({
  id: 'composite',
  category: 'structural',
  icon: '🌳',
  content: { en, bn },
  code: compositeCode,
  Visual: lazy(() => import('./Visual')),
})
