import { lazy } from 'react'
import { definePattern } from '../define'
import { commandCode } from './code'
import { bn } from './content.bn'
import { en } from './content.en'

export const command = definePattern({
  id: 'command',
  category: 'behavioral',
  icon: '🎮',
  content: { en, bn },
  code: commandCode,
  Visual: lazy(() => import('./Visual')),
})
