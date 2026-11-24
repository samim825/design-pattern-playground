import { lazy } from 'react'
import { definePattern } from '../define'
import { factoryMethodCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const factoryMethod = definePattern({
  id: 'factory-method',
  category: 'creational',
  icon: '🏭',
  content: { en, bn },
  code: factoryMethodCode,
  Visual: lazy(() => import('./Visual')),
})
