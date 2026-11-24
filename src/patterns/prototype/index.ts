import { lazy } from 'react'
import { definePattern } from '../define'
import { prototypeCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const prototype = definePattern({
  id: 'prototype',
  category: 'creational',
  icon: '🧬',
  content: { en, bn },
  code: prototypeCode,
  Visual: lazy(() => import('./Visual')),
})
