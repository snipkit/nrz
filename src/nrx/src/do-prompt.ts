import type { Spec } from '@nrz/spec'
import type { PromptFn } from './index.ts'

export const doPrompt = async (
  spec: Spec,
  dir: string,
  resolution: string,
  fn?: PromptFn,
): Promise<boolean> => {
  if (!fn) return true
  const result = (await fn(spec, dir, resolution))
    .trim()
    .toLowerCase()
  return !result || result.startsWith('y')
}
