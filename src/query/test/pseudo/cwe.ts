import t from 'tap'
import { joinDepIDTuple } from '@nrz/dep-id'
import { asSecurityArchiveLike } from '@nrz/security-archive'
import type { PackageReportData } from '@nrz/security-archive'
import { getSimpleGraph } from '../fixtures/graph.ts'
import type { ParserState } from '../../src/types.ts'
import { cwe } from '../../src/pseudo/cwe.ts'
import { parse } from '../../src/parser.ts'

t.test('selects packages with a CWE alert', async t => {
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
      retries: 0,
      securityArchive: asSecurityArchiveLike(
        new Map([
          [
            joinDepIDTuple(['registry', '', 'e@1.0.0']),
            {
              id: 'e@1.0.0',
              author: [],
              size: 0,
              type: 'npm',
              name: 'e',
              version: '1.0.0',
              license: 'MIT',
              score: {
                overall: 0,
                license: 0,
                maintenance: 0,
                quality: 0,
                supplyChain: 0,
                vulnerability: 0,
                signal: new AbortController().signal,
                specificity: { idCounter: 0, commonCounter: 0 },
              },
              alerts: [
                {
                  key: '12314320948130',
                  type: 'cve',
                  severity: 'high',
                  category: 'security',
                  props: {
                    lastPublish: '2023-01-01',
                    cveId: 'CVE-2023-1234' as const,
                    cwes: [
                      { id: 'CWE-79' as const },
                      { id: 'CWE-89' as const },
                    ],
                  },
                },
              ],
            } as PackageReportData,
          ],
        ]),
      ),
      specOptions: {},
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    return state
  }

  await t.test(
    'filter out any node that does not have the alert',
    async t => {
      const res = await cwe(getState(':cwe(CWE-79)'))
      t.strictSame(
        [...res.partial.nodes].map(n => n.name),
        ['e'],
        'should select only packages with matching CWE ID',
      )
      t.matchSnapshot({
        nodes: [...res.partial.nodes].map(n => n.name),
        edges: [...res.partial.edges].map(e => e.name),
      })
    },
  )

  await t.test('should not match an unseen CWE ID', async t => {
    const res = await cwe(getState(':cwe(CWE-123)'))
    t.strictSame(
      [...res.partial.nodes].map(n => n.name),
      [],
      'should not select any packages when CWE ID does not match',
    )
    t.matchSnapshot({
      nodes: [...res.partial.nodes].map(n => n.name),
      edges: [...res.partial.edges].map(e => e.name),
    })
  })

  await t.test(
    'filter out any node that does not match the quoted CWE ID',
    async t => {
      const res = await cwe(getState(':cwe("CWE-89")'))
      t.strictSame(
        [...res.partial.nodes].map(n => n.name),
        ['e'],
        'should select only packages with matching CWE ID',
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
      retries: 0,
      securityArchive: undefined,
      specOptions: {},
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    return state
  }

  await t.rejects(
    cwe(getState(':cwe(CWE-79)')),
    /Missing security archive/,
    'should throw an error',
  )
})

t.test('missing CWE ID', async t => {
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
      retries: 0,
      securityArchive: asSecurityArchiveLike(new Map()),
      specOptions: {},
      signal: new AbortController().signal,
      specificity: { idCounter: 0, commonCounter: 0 },
    }
    return state
  }

  await t.rejects(
    cwe(getState(':cwe()')),
    /Failed to parse :cwe selector/,
    'should throw an error',
  )
})
