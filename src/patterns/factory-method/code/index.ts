import type { PatternCode } from '@/types/pattern'
import { csharp } from './csharp'
import { java } from './java'
import { ts } from './ts'

/** The same example in every code language; all use the same @step ids. */
export const factoryMethodCode: PatternCode = { ts, java, csharp }
