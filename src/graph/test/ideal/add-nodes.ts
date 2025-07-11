import { joinDepIDTuple } from '@nrz/dep-id'
import type { PackageInfoClient } from '@nrz/package-info'
import type { SpecOptions } from '@nrz/spec'
import { kCustomInspect, Spec } from '@nrz/spec'
import type { DependencySaveType } from '@nrz/types'
import { PathScurry } from 'path-scurry'
import t from 'tap'
import type {
  AddImportersDependenciesMap,
  Dependency,
} from '../../src/dependencies.ts'
import { Graph } from '../../src/graph.ts'
import type { GraphModifier } from '../../src/modifiers.ts'
import { addNodes } from '../../src/ideal/add-nodes.ts'
import { objectLikeOutput } from '../../src/visualization/object-like-output.ts'

Object.assign(Spec.prototype, {
  [kCustomInspect](this: Spec) {
    return `Spec {${this}}`
  },
})

const configData = {
  registry: 'https://registry.npmjs.org/',
  registries: {
    npm: 'https://registry.npmjs.org/',
  },
} satisfies SpecOptions

t.test('addNodes', async t => {
  const fooManifest = {
    name: 'foo',
    version: '1.0.0',
    dependencies: {
      bar: '^1.0.0',
    },
  }
  const barManifest = {
    name: 'bar',
    version: '1.0.0',
  }
  const mainManifest = {
    name: 'my-project',
    version: '1.0.0',
  }
  const graph = new Graph({
    projectRoot: t.testdirName,
    ...configData,
    mainManifest,
  })
  const packageInfo = {
    async manifest(spec: Spec) {
      switch (spec.name) {
        case 'bar':
          return barManifest
        case 'foo':
          return fooManifest
      }
    },
  } as PackageInfoClient
  const addEntry = (
    name: string,
    type: DependencySaveType = 'implicit',
  ) =>
    new Map(
      Object.entries({
        foo: {
          spec: Spec.parse(name, '^1.0.0'),
          type,
        } satisfies Dependency,
      }),
    )

  t.matchSnapshot(objectLikeOutput(graph), 'initial graph')

  await addNodes({
    add: new Map([
      [joinDepIDTuple(['file', '.']), addEntry('foo')],
    ]) as AddImportersDependenciesMap,
    graph,
    packageInfo,
    scurry: new PathScurry(t.testdirName),
  })
  t.matchSnapshot(objectLikeOutput(graph), 'graph with an added foo')

  await addNodes({
    add: new Map([
      [joinDepIDTuple(['file', '.']), addEntry('foo')],
    ]) as AddImportersDependenciesMap,
    graph,
    scurry: new PathScurry(t.testdirName),
    packageInfo,
  })
  t.matchSnapshot(
    objectLikeOutput(graph),
    'graph after adding foo when there is an already existing foo',
  )

  await t.rejects(
    addNodes({
      add: new Map([
        [joinDepIDTuple(['file', 'unknown']), addEntry('foo')],
      ]) as AddImportersDependenciesMap,
      graph,
      packageInfo,
      scurry: new PathScurry(t.testdirName),
    }),
    /Could not find importer/,
    'should throw an error if finding an unknown importer id',
  )

  // place a missing package bar on the main importer
  graph.placePackage(
    graph.mainImporter,
    'prod',
    Spec.parse('bar', '^1.0.0'),
  )
  t.matchSnapshot(
    objectLikeOutput(graph),
    'graph with missing package bar',
  )

  // now it should install the package bar to the main importer
  await addNodes({
    add: new Map([
      [joinDepIDTuple(['file', '.']), addEntry('bar', 'dev')],
    ]) as AddImportersDependenciesMap,
    scurry: new PathScurry(t.testdirName),
    graph,
    packageInfo,
  })
  t.matchSnapshot(
    objectLikeOutput(graph),
    'graph after adding a previously missing dependency bar',
  )

  t.test('with modifiers', async t => {
    const modifierCalls = {
      tryImporter: 0,
      tryDependencies: 0,
    }

    const mockModifier = {
      tryImporter: () => {
        modifierCalls.tryImporter++
        return undefined
      },
      tryDependencies: () => {
        modifierCalls.tryDependencies++
        return new Map()
      },
    } as unknown as GraphModifier

    await addNodes({
      add: new Map([
        [joinDepIDTuple(['file', '.']), addEntry('foo')],
      ]) as AddImportersDependenciesMap,
      graph,
      packageInfo,
      scurry: new PathScurry(t.testdirName),
      modifiers: mockModifier,
    })

    t.equal(modifierCalls.tryImporter, 1, 'tryImporter was called')
    t.equal(
      modifierCalls.tryDependencies,
      2,
      'tryDependencies was called',
    )
  })
})
