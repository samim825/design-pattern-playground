import { lazy } from 'react'
import { definePattern } from '../define'
import { singletonCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const singleton = definePattern({
  id: 'singleton',
  category: 'creational',
  icon: '☝️',
  content: { en, bn },
  code: singletonCode,
  Visual: lazy(() => import('./Visual')),
})
