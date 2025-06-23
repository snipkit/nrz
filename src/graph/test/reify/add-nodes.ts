import { joinDepIDTuple } from '@nrz/dep-id'
import type { PackageInfoClient } from '@nrz/package-info'
import type { RollbackRemove } from '@nrz/rollback-remove'
import { Spec } from '@nrz/spec'
import { resolve } from 'node:path'
import { PathScurry } from 'path-scurry'
import t from 'tap'
import type { Diff } from '../../src/diff.ts'

import { addNodes } from '../../src/reify/add-nodes.ts'

const removed: string[] = []
const mockRemover = {
  rm: async (path: string) => removed.push(path),
} as unknown as RollbackRemove

const extracted: [Spec, string][] = []
const mockPackageInfo = {
  extract: async (spec: Spec, target: string) => {
    if (spec.name === 'failer') {
      throw new Error('failer fails to extract')
    }
    extracted.push([spec, target])
  },
} as unknown as PackageInfoClient

const inNrzStoreFalse = () => false
const inNrzStoreTrue = () => true

const isOptionalFalse = () => false
const isOptionalTrue = () => true

const node = (props: Record<string, any>) => ({
  ...props,
  resolvedLocation: (scurry: PathScurry) =>
    scurry.cwd.resolve(props.location).fullpath(),
})

const diff = {
  to: {
    removeNode: () => {},
  },
  nodes: {
    delete: new Set<any>([]),
    add: new Set([
      // not in nrz store
      {
        name: 'name',
        inNrzStore: inNrzStoreFalse,
        isOptional: isOptionalFalse,
      },
      // this one gets added
      node({
        id: joinDepIDTuple(['registry', '', 'foo@1.2.3']),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple(['registry', '', 'foo@1.2.3']) +
          '/node_modules/foo',
        name: 'foo',
        isOptional: isOptionalFalse,
      }),
      // this one too, but has a manifest
      node({
        id: joinDepIDTuple(['registry', '', 'bar@1.2.3']),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple(['registry', '', 'bar@1.2.3']) +
          '/node_modules/bar',
        name: 'bar',
        manifest: { name: 'bar', version: '1.2.3' },
        isOptional: isOptionalFalse,
      }),
      // this one fails, but it's optional, so it's fine
      node({
        id: joinDepIDTuple(['registry', '', 'failer@1.2.3']),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple(['registry', '', 'failer@1.2.3']) +
          '/node_modules/failer',
        name: 'failer',
        manifest: { name: 'failer', version: '1.2.3' },
        isOptional: isOptionalTrue,
        edgesIn: new Set(),
      }),
      // this one is incompatible and it's optional, so skip it
      node({
        id: joinDepIDTuple([
          'registry',
          '',
          'optional-incompatible@1.2.3',
        ]),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple([
            'registry',
            '',
            'optional-incompatible@1.2.3',
          ]) +
          '/node_modules/optional-incompatible',
        name: 'optional-incompatible',
        manifest: {
          name: 'optional-incompatible',
          version: '1.2.3',
          engines: { node: '1.x' },
        },
        isOptional: isOptionalTrue,
        edgesIn: new Set(),
      }),
      // this one is deprecated and it's optional, so skip it
      node({
        id: joinDepIDTuple([
          'registry',
          '',
          'optional-deprecated@1.2.3',
        ]),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple([
            'registry',
            '',
            'optional-deprecated@1.2.3',
          ]) +
          '/node_modules/optional-deprecated',
        name: 'optional-deprecated',
        manifest: {
          name: 'optional-deprecated',
          version: '1.2.3',
          deprecated: 'do not use this',
        },
        isOptional: isOptionalTrue,
        edgesIn: new Set(),
      }),
    ]),
  },
} as unknown as Diff

const scurry = new PathScurry(t.testdirName)

await Promise.all(
  addNodes(diff, scurry, mockRemover, {}, mockPackageInfo).map(x =>
    x(),
  ),
)

t.notMatch(
  diff.nodes.add,
  new Set([{ id: joinDepIDTuple(['registry', '', 'failer@1.2.3']) }]),
  'failer was removed',
)
t.match(
  diff.nodes.delete,
  new Set([{ id: joinDepIDTuple(['registry', '', 'failer@1.2.3']) }]),
  'failer scheduled for deletion',
)

t.strictSame(removed, [
  resolve(
    t.testdirName,
    'node_modules/.nrz/' +
      joinDepIDTuple(['registry', '', 'foo@1.2.3']) +
      '/node_modules/foo',
  ),
  resolve(
    t.testdirName,
    'node_modules/.nrz/' +
      joinDepIDTuple(['registry', '', 'bar@1.2.3']) +
      '/node_modules/bar',
  ),
  resolve(
    t.testdirName,
    'node_modules/.nrz/' +
      joinDepIDTuple(['registry', '', 'failer@1.2.3']) +
      '/node_modules/failer',
  ),
])

t.strictSame(extracted, [
  [
    Spec.parse('foo@1.2.3'),
    resolve(
      t.testdirName,
      'node_modules/.nrz/' +
        joinDepIDTuple(['registry', '', 'foo@1.2.3']) +
        '/node_modules/foo',
    ),
  ],
  [
    Spec.parse('bar@1.2.3'),
    resolve(
      t.testdirName,
      'node_modules/.nrz/' +
        joinDepIDTuple(['registry', '', 'bar@1.2.3']) +
        '/node_modules/bar',
    ),
  ],
])
