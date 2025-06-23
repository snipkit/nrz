import { joinDepIDTuple } from '@nrz/dep-id'
import type { RollbackRemove } from '@nrz/rollback-remove'
import { PathScurry } from 'path-scurry'
import t from 'tap'
import type { Diff } from '../../src/diff.ts'

const removed: string[] = []
const mockRemover = {
  rm: async (path: string) => removed.push(path),
} as unknown as RollbackRemove

const edgesDeleted: unknown[] = []
const mockEdgeDeleter = async (edge: unknown) =>
  edgesDeleted.push(edge)

const { deleteNodes } = await t.mockImport<
  typeof import('../../src/reify/delete-nodes.ts')
>('../../src/reify/delete-nodes.ts', {
  '../../src/reify/delete-edge.ts': { deleteEdge: mockEdgeDeleter },
})

const inNrzStoreFalse = () => false
const inNrzStoreTrue = () => true

const mockEdge = {}

const diff = {
  nodes: {
    delete: new Set([
      // not in nrz store
      { name: 'name', inNrzStore: inNrzStoreFalse, edgesIn: [] },
      // this one gets added
      {
        id: joinDepIDTuple(['registry', '', 'foo@1.2.3']),
        inNrzStore: inNrzStoreTrue,
        location:
          './node_modules/.nrz/' +
          joinDepIDTuple(['registry', '', 'foo@1.2.3']) +
          '/node_modules/foo',
        name: 'foo',
        edgesIn: [mockEdge],
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

t.equal(edgesDeleted[0], mockEdge, 'deleted incoming edge')
