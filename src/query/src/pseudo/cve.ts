import { error } from '@nrz/error-cause'
import {
  asPostcssNodeWithChildren,
  asStringNode,
  asTagNode,
  isStringNode,
  isTagNode,
} from '@nrz/dss-parser'
import {
  assertSecurityArchive,
  removeDanglingEdges,
  removeNode,
  removeQuotes,
} from './helpers.ts'
import type { ParserState } from '../types.ts'
import type { PostcssNode } from '@nrz/dss-parser'

export type CveInternals = {
  cveId: string
}

export const parseInternals = (
  nodes: PostcssNode[],
): CveInternals => {
  let cveId = ''

  if (isStringNode(asPostcssNodeWithChildren(nodes[0]).nodes[0])) {
    cveId = removeQuotes(
      asStringNode(asPostcssNodeWithChildren(nodes[0]).nodes[0])
        .value,
    )
  } else if (
    isTagNode(asPostcssNodeWithChildren(nodes[0]).nodes[0])
  ) {
    cveId = asTagNode(
      asPostcssNodeWithChildren(nodes[0]).nodes[0],
    ).value
  }

  if (!cveId) {
    throw error('Expected a CVE ID', {
      found: asPostcssNodeWithChildren(nodes[0]).nodes[0],
    })
  }

  return { cveId }
}

/**
 * Filters out any node that does not have a CVE alert with the specified CVE ID.
 */
export const cve = async (state: ParserState) => {
  assertSecurityArchive(state, 'cve')

  let internals
  try {
    internals = parseInternals(
      asPostcssNodeWithChildren(state.current).nodes,
    )
  } catch (err) {
    throw error('Failed to parse :cve selector', { cause: err })
  }

  const { cveId } = internals
  for (const node of state.partial.nodes) {
    const report = state.securityArchive.get(node.id)
    const exclude = !report?.alerts.some(
      alert =>
        alert.props?.cveId?.trim().toLowerCase() ===
        cveId.trim().toLowerCase(),
    )
    if (exclude) {
      removeNode(state, node)
    }
  }

  removeDanglingEdges(state)

  return state
}
