import { error } from '@nrz/error-cause'
import type { Manifest } from '@nrz/types'
import { XDG } from '@nrz/xdg'
import { resolve } from 'node:path'
import type { VlxInfo, VlxManifest, VlxOptions } from './index.ts'
import { inferDefaultExecutable } from './infer-default-executable.ts'

import { mountPath } from './mount-path.ts'

export const nrxInfo = (
  path: string,
  options: VlxOptions,
  manifest?: Manifest,
): VlxInfo => {
  const root = new XDG('nrz/nrx').data()
  path = mountPath(root, path)

  try {
    // do not allow it to traverse up or read arbitrary paths
    const { packageJson } = options
    manifest ??= packageJson.read(path)
    const { dependencies = {} } = manifest

    // every one of these has exactly one dep, on the resolved url
    for (const [name, resolved] of Object.entries(dependencies)) {
      const p = resolve(path, 'node_modules', name)
      const pj = packageJson.read(p, { reload: true })
      const def = inferDefaultExecutable(pj)
      const arg0 = def?.[0]
      const { nrx } = manifest as VlxManifest
      return {
        path,
        name,
        version: pj.version,
        resolved,
        arg0,
        ...nrx,
      }
    }
  } catch (er) {
    throw error('Could not get nrx information', er as Error)
  }
  throw error('Could not get nrx information')
}
