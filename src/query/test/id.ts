import t from 'tap'
import { id } from '../src/id.ts'
import { getAliasedGraph, getSimpleGraph } from './fixtures/graph.ts'
import {
  copyGraphSelectionState,
  getGraphSelectionState,
  selectorFixture,
} from './fixtures/selector.ts'
import type { TestCase } from './fixtures/types.ts'
import type { GraphSelectionState } from '../src/types.ts'
import type { EdgeLike, NodeLike } from '@nrz/graph'

const testId = selectorFixture(id)

t.test('id', async t => {
  const simpleGraph = getSimpleGraph()
  const all: GraphSelectionState = {
    edges: new Set<EdgeLike>(simpleGraph.edges),
    nodes: new Set<NodeLike>(simpleGraph.nodes.values()),
  }
  const b = getGraphSelectionState(simpleGraph, 'b')
  const empty: GraphSelectionState = {
    edges: new Set(),
    nodes: new Set(),
  }
  const queryToExpected = new Set<TestCase>([
    ['#my-project', all, ['my-project']], // select root node
    ['#a', all, ['a']], // direct dep
    ['#f', all, ['f']], // transitive dep
    ['#a', b, []], // missing from partial
    ['#b', b, ['b']], // exact match from partial
    ['#a', empty, []], // no partial
  ])
  const initial = copyGraphSelectionState(all)
  for (const [query, partial, expected] of queryToExpected) {
    const res = await testId(
      query,
      initial,
      copyGraphSelectionState(partial),
    )
    t.strictSame(
      res.nodes.map(i => i.name),
      expected,
      `query > "${query}"`,
    )
    t.matchSnapshot(
      {
        edges: res.edges.map(i => i.name).sort(),
        nodes: res.nodes.map(i => i.name).sort(),
      },
      `query > "${query}"`,
    )
  }

  await t.test('aliased graph', async t => {
    const aliasedGraph = getAliasedGraph()
    const all: GraphSelectionState = {
      edges: new Set<EdgeLike>(aliasedGraph.edges),
      nodes: new Set<NodeLike>(aliasedGraph.nodes.values()),
    }
    const empty: GraphSelectionState = {
      edges: new Set(),
      nodes: new Set(),
    }
    const queryToExpected = new Set<TestCase>([
      ['#aliased-project', all, ['aliased-project']], // select root node
      ['#a', all, ['a']], // regular direct dep
      ['#b', all, ['foo']], // select aliased dep by its dep name alias
      ['#foo', all, []], // do not select aliased dep by its pkg name
      ['#bar', all, ['d']], // select transitive aliased dep by its alias
      ['#a', empty, []], // no partial
    ])
    const initial = copyGraphSelectionState(all)
    for (const [query, partial, expected] of queryToExpected) {
      const res = await testId(
        query,
        initial,
        copyGraphSelectionState(partial),
      )
      t.strictSame(
        res.nodes.map(i => i.name),
        expected,
        `query > "${query}"`,
      )
      t.matchSnapshot(
        {
          edges: res.edges.map(i => i.name).sort(),
          nodes: res.nodes.map(i => i.name).sort(),
        },
        `query > "${query}"`,
      )
    }
  })
})

t.test('bad selector type', async t => {
  await t.rejects(
    testId(':foo'),
    /Mismatching query node/,
    'should throw an error',
  )
})
