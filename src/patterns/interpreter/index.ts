import { lazy } from 'react'
import { definePattern } from '../define'
import { interpreterCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const interpreter = definePattern({
  id: 'interpreter',
  category: 'behavioral',
  icon: '🗣️',
  content: { en, bn },
  code: interpreterCode,
  Visual: lazy(() => import('./Visual')),
})
