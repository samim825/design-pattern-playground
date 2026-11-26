import { lazy } from 'react'
import { definePattern } from '../define'
import { mementoCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const memento = definePattern({
  id: 'memento',
  category: 'behavioral',
  icon: '💾',
  content: { en, bn },
  code: mementoCode,
  Visual: lazy(() => import('./Visual')),
})
