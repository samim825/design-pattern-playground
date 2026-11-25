import { lazy } from 'react'
import { definePattern } from '../define'
import { proxyCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const proxy = definePattern({
  id: 'proxy',
  category: 'structural',
  icon: '🛡️',
  content: { en, bn },
  code: proxyCode,
  Visual: lazy(() => import('./Visual')),
})
