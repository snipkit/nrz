import { Spec, kCustomInspect } from '@nrz/spec'
import type { SpecOptions } from '@nrz/spec'
import { inspect } from 'node:util'
import t from 'tap'
import { Edge } from '../src/edge.ts'
import { Node } from '../src/node.ts'
import type { GraphLike } from '../src/types.ts'

t.cleanSnapshot = s =>
  s.replace(/^(\s+)projectRoot: .*$/gm, '$1projectRoot: #')

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

t.test('Edge', async t => {
  const opts = {
    ...configData,
    projectRoot: t.testdirName,
    graph: {} as GraphLike,
  }
  const rootMani = {
    name: 'root',
    version: '1.0.0',
  }
  const rootSpec = Spec.parse('root@1.0.0')
  const root = new Node(opts, undefined, rootMani, rootSpec)
  const childMani = {
    name: 'child',
    version: '1.0.0',
  }
  const childSpec = Spec.parse('child@1.0.0')
  const child = new Node(opts, undefined, childMani, childSpec)

  const edge = new Edge(
    'prod',
    Spec.parse('child@^1.0.0'),
    root,
    child,
  )
  t.ok(edge.valid(), 'valid edge')
  t.equal(edge.name, 'child')
  t.equal(edge.dev, false)
  t.equal(edge.optional, false)
  t.matchSnapshot(inspect(edge, { depth: 0 }))
  const dangling = new Edge(
    'prod',
    Spec.parse('missing', 'latest'),
    child,
  )
  t.notOk(dangling.valid(), 'invalid edge')
  t.matchSnapshot(inspect(dangling, { depth: 1 }))
  const optional = new Edge(
    'optional',
    Spec.parse('missing', 'latest'),
    child,
  )
  t.equal(optional.optional, true)

  const pdmMani = {
    name: 'pdm',
    version: '1.2.3',
    peerDependencies: { foo: '*' },
    peerDependenciesMeta: { foo: { optional: true } },
  }
  const pdmSpec = Spec.parse('pdm@1.2.3')
  const pdm = new Node(opts, undefined, pdmMani, pdmSpec)
  const pdmEdge = new Edge('peerOptional', Spec.parse('foo@*'), pdm)
  t.equal(pdmEdge.peer, true)
  t.equal(pdmEdge.peerOptional, true)
})
