import t from 'tap'
import { joinDepIDTuple } from '@nrz/dep-id'
import { asSecurityArchiveLike } from '@nrz/security-archive'
import { getSimpleGraph } from '../fixtures/graph.ts'
import type { ParserState } from '../../src/types.ts'
import { obfuscated } from '../../src/pseudo/obfuscated.ts'
import { parse } from '../../src/parser.ts'

t.test('selects packages with an obfuscated alert', async t => {
  const getState = (query: string, graph = getSimpleGraph()) => {
    const ast = parse(query)
    const current = ast.first.first
    const state: ParserState = {
      comment: '',
      current,
      initial: {
        edges: new Set(graph.edges.values()),
        nodes: new Set(graph.nodes.values()),
      },
      partial: {
        edges: new Set(graph.edges.values()),
        nodes: new Set(graph.nodes.values()),
      },
      collect: {
        edges: new Set(),
        nodes: new Set(),
      },
      cancellable: async () => {},
      walk: async i => i,
      securityArchive: asSecurityArchiveLike(
        new Map([
          [
            joinDepIDTuple(['registry', '', 'e@1.0.0']),
            { alerts: [{ type: 'obfuscatedFile' }] },
          ],
        ]),
      ),
      specOptions: {},
      retries: 0,
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    return state
  }

  await t.test(
    'filter out any node that does not have the alert',
    async t => {
      const res = await obfuscated(getState(':obfuscated'))
      t.strictSame(
        [...res.partial.nodes].map(n => n.name),
        ['e'],
        'should select only obfuscated packages',
      )
      t.matchSnapshot({
        nodes: [...res.partial.nodes].map(n => n.name),
        edges: [...res.partial.edges].map(e => e.name),
      })
    },
  )
})

t.test('missing security archive', async t => {
  const getState = (query: string) => {
    const ast = parse(query)
    const current = ast.first.first
    const state: ParserState = {
      comment: '',
      current,
      initial: {
        edges: new Set(),
        nodes: new Set(),
      },
      partial: {
        edges: new Set(),
        nodes: new Set(),
      },
      collect: {
        edges: new Set(),
        nodes: new Set(),
      },
      cancellable: async () => {},
      walk: async i => i,
      securityArchive: undefined,
      specOptions: {},
      retries: 0,
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    return state
  }

  await t.rejects(
    obfuscated(getState(':obfuscated')),
    { message: /Missing security archive/ },
    'should throw an error',
  )
})
