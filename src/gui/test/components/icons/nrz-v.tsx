import { afterEach, expect, test } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import html from 'diffable-html'
import { NRZV } from '@/components/icons/nrz-v.jsx'

expect.addSnapshotSerializer({
  serialize: v => html(v),
  test: () => true,
})

afterEach(() => {
  cleanup()
})

test('nrz v icon render default', () => {
  render(<NRZV />)
  expect(window.document.body.innerHTML).toMatchSnapshot()
})

test('nrz v icon render custom class', () => {
  render(<NRZV className="custom-class" />)
  expect(window.document.body.innerHTML).toMatchSnapshot()
})
