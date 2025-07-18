import { vi, test, expect, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import html from 'diffable-html'
import { useGraphStore as useStore } from '@/state/index.ts'
import { QueryHighlighter } from '@/components/query-bar/query-highlighter.tsx'
import { Query } from '@nrz/query'

vi.mock('@/components/query-bar/query-token.tsx', () => ({
  QueryToken: 'gui-query-token',
}))

expect.addSnapshotSerializer({
  serialize: v => html(v),
  test: () => true,
})

afterEach(() => {
  const CleanUp = () => (useStore(state => state.reset)(), '')
  render(<CleanUp />)
  cleanup()
})

test('query-highlighter render default', () => {
  const mockQuery = ':root > :not(#react, [name="react-sass"])'
  const mockParsedTokens = Query.getQueryTokens(mockQuery)

  const Container = () => {
    return (
      <QueryHighlighter
        query={mockQuery}
        parsedTokens={mockParsedTokens}
      />
    )
  }

  const { container } = render(<Container />)
  expect(container.innerHTML).toMatchSnapshot()
})
