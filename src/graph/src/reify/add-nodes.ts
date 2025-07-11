import { hydrate } from '@nrz/dep-id'
import type { PackageInfoClient } from '@nrz/package-info'
import { platformCheck } from '@nrz/pick-manifest'
import type { RollbackRemove } from '@nrz/rollback-remove'
import type { SpecOptions } from '@nrz/spec'
import type { PathScurry } from 'path-scurry'
import type { Diff } from '../diff.ts'
import { optionalFail } from './optional-fail.ts'

export const addNodes = (
  diff: Diff,
  scurry: PathScurry,
  remover: RollbackRemove,
  options: SpecOptions,
  packageInfo: PackageInfoClient,
): (() => Promise<unknown>)[] => {
  const actions: (() => Promise<unknown>)[] = []
  // fetch and extract all the nodes, removing any in the way
  for (const node of diff.nodes.add) {
    /* c8 ignore next - all nodes have manifests by this point */
    const { manifest = {} } = node
    // if it's not in the store, we don't have to extract it, because
    // we're just linking to a location that already exists.
    if (!node.inNrzStore()) continue
    // remove anything already there
    const target = node.resolvedLocation(scurry)
    const from = scurry.resolve('')
    const spec = hydrate(node.id, manifest.name, options)
    const onErr = optionalFail(diff, node)
    const { integrity, resolved } = node
    // if it's optional, and we know it isn't for this platform, or it's
    // deprecated, don't install it. if it's not optional, try our best.
    if (
      onErr &&
      (manifest.deprecated ||
        !platformCheck(
          manifest,
          process.version,
          process.platform,
          process.arch,
        ))
    ) {
      onErr()
      continue
    }
    actions.push(() =>
      remover.rm(target).then(() =>
        onErr ?
          packageInfo
            .extract(spec, target, { from, integrity, resolved })
            .then(x => x, onErr)
        : packageInfo.extract(spec, target, {
            from,
            integrity,
            resolved,
          }),
      ),
    )
  }
  return actions
}
