import type { PatternCode } from '@/types/pattern'
import { cpp } from './cpp'
import { csharp } from './csharp'
import { go } from './go'
import { java } from './java'
import { php } from './php'
import { python } from './python'
import { ruby } from './ruby'
import { rust } from './rust'
import { swift } from './swift'
import { ts } from './ts'

/** The same example in every code language; all use the same @step ids. Tab order comes from CODE_LANGS. */
export const builderCode: PatternCode = { java, csharp, ts, python, go, rust, cpp, php, ruby, swift }
