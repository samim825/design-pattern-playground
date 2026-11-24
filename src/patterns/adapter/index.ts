import { lazy } from 'react'
import { definePattern } from '../define'
import { adapterCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const adapter = definePattern({
  id: 'adapter',
  category: 'structural',
  icon: '🔌',
  content: { en, bn },
  code: adapterCode,
  Visual: lazy(() => import('./Visual')),
})
