import { lazy } from 'react'
import { definePattern } from '../define'
import { abstractFactoryCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const abstractFactory = definePattern({
  id: 'abstract-factory',
  category: 'creational',
  icon: '🏗️',
  content: { en, bn },
  code: abstractFactoryCode,
  Visual: lazy(() => import('./Visual')),
})
