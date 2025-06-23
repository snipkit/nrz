import { afterEach, expect, test } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import html from 'diffable-html'
import { Nrz } from '@/components/icons/index.ts'

expect.addSnapshotSerializer({
  serialize: v => html(v),
  test: () => true,
})

afterEach(() => {
  cleanup()
})

test('nrz icon render default', () => {
  render(<Nrz />)
  expect(window.document.body.innerHTML).toMatchSnapshot()
})

test('nrz icon render custom class', () => {
  render(<Nrz className="custom-class" />)
  expect(window.document.body.innerHTML).toMatchSnapshot()
})
