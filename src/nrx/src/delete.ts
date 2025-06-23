import type { RollbackRemove } from '@nrz/rollback-remove'
import { basename } from 'node:path'
import type { VlxOptions } from './index.ts'
import { nrxInfo } from './info.ts'
import { nrxList } from './list.ts'

const keyMatch = (keys: string[], path: string): boolean => {
  if (!keys.length) return true
  for (const k of keys) {
    if (path.includes(k)) return true
  }
  return false
}

export const nrxDelete = async (
  keys: string[],
  remover: RollbackRemove,
  options: VlxOptions,
) => {
  const removed: string[] = []
  const promises: Promise<void>[] = []
  for await (const p of nrxList()) {
    // if the request for info fails, delete it
    const key = basename(p)
    try {
      nrxInfo(p, options)
      if (keyMatch(keys, key)) {
        promises.push(remover.rm(p))
        removed.push(key)
      }
    } catch {
      // delete if no good
      promises.push(remover.rm(p))
      removed.push(key)
    }
  }
  await Promise.all(promises)
  return removed
}
