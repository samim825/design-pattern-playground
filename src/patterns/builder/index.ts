import { lazy } from 'react'
import { definePattern } from '../define'
import { builderCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const builder = definePattern({
  id: 'builder',
  category: 'creational',
  icon: '🧱',
  content: { en, bn },
  code: builderCode,
  Visual: lazy(() => import('./Visual')),
})
