import { joinDepIDTuple } from '@nrz/dep-id'
import { type RollbackRemove } from '@nrz/rollback-remove'
import { PathScurry } from 'path-scurry'
import t from 'tap'
import { type Diff } from '../../src/diff.ts'
import { deleteNodes } from '../../src/reify/delete-nodes.ts'

const removed: string[] = []
const mockRemover = {
  rm: async (path: string) => removed.push(path),
} as unknown as RollbackRemove

const inNrzStoreFalse = () => false
const inNrzStoreTrue = () => true

const diff = {
  nodes: {
    delete: new Set([
      // not in nrz store
      { name: 'name', inNrzStore: inNrzStoreFalse },
      // this one gets added
      {
        id: joinDepIDTuple(['registry', '', 'foo@1.2.3']),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple(['registry', '', 'foo@1.2.3']) +
          '/node_modules/foo',
        name: 'foo',
      },
    ]),
  },
} as unknown as Diff

const scurry = new PathScurry(t.testdirName)

await Promise.all(deleteNodes(diff, mockRemover, scurry))

t.strictSame(removed, [
  scurry.resolve(
    'node_modules/.nrz/' +
      joinDepIDTuple(['registry', '', 'foo@1.2.3']),
  ),
])
