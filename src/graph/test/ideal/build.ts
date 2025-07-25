import { joinDepIDTuple } from '@nrz/dep-id'
import type { DepIDTuple } from '@nrz/dep-id'
import { PackageInfoClient } from '@nrz/package-info'
import { PackageJson } from '@nrz/package-json'
import { Monorepo } from '@nrz/workspaces'
import { PathScurry } from 'path-scurry'
import t from 'tap'
import { build } from '../../src/ideal/build.ts'
import { objectLikeOutput } from '../../src/visualization/object-like-output.ts'
import type { LockfileEdgeKey } from '../../src/index.ts'
import type {
  AddImportersDependenciesMap,
  RemoveImportersDependenciesMap,
} from '../../src/dependencies.ts'

const edgeKey = (from: DepIDTuple, to: string): LockfileEdgeKey =>
  `${joinDepIDTuple(from)} ${to}`

t.test('build from lockfile', async t => {
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
      dependencies: {
        foo: '^1.0.0',
      },
    }),
    'nrz-lock.json': JSON.stringify({
      options: {},
      nodes: {
        [joinDepIDTuple(['registry', '', 'foo@1.0.0'])]: [
          0,
          'foo',
          'sha512-6/mh1E2u2YgEsCHdY0Yx5oW+61gZU+1vXaoiHHrpKeuRNNgFvS+/jrwHiQhB5apAf5oB7UB7E19ol2R2LKH8hQ==',
        ],
      },
      edges: {
        [edgeKey(['file', '.'], 'foo')]:
          'prod ^1.0.0 ' +
          joinDepIDTuple(['registry', '', 'foo@1.0.0']),
      },
    }),
  })

  const graph = await build({
    scurry: new PathScurry(projectRoot),
    monorepo: Monorepo.maybeLoad(projectRoot),
    packageJson: new PackageJson(),
    packageInfo: new PackageInfoClient({ projectRoot }),
    projectRoot,
    add: new Map([
      [joinDepIDTuple(['file', '.']), new Map()],
    ]) as AddImportersDependenciesMap,
    remove: new Map() as RemoveImportersDependenciesMap,
  })

  t.matchSnapshot(
    objectLikeOutput(graph),
    'should build an ideal tree starting from a virtual graph',
  )
})

t.test('build from actual files', async t => {
  const projectRoot = t.testdir({
    'package.json': JSON.stringify({
      name: 'my-project',
      version: '1.0.0',
      dependencies: {
        foo: '^1.0.0',
      },
    }),
    node_modules: {
      '.nrz': {
        [joinDepIDTuple(['registry', '', 'foo@1.0.0'])]: {
          node_modules: {
            foo: {
              'package.json': JSON.stringify({
                name: 'foo',
                version: '1.0.0',
              }),
            },
          },
        },
      },
      foo: t.fixture(
        'symlink',
        '.nrz/' +
          joinDepIDTuple(['registry', '', 'foo@1.0.0']) +
          '/node_modules/foo',
      ),
    },
  })

  const graph = await build({
    scurry: new PathScurry(projectRoot),
    monorepo: Monorepo.maybeLoad(projectRoot),
    packageJson: new PackageJson(),
    packageInfo: new PackageInfoClient({ projectRoot }),
    projectRoot,
  })

  t.matchSnapshot(
    objectLikeOutput(graph),
    'should build an ideal tree starting from a virtual graph',
  )
})
