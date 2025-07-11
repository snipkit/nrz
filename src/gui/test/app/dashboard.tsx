import {
  test,
  expect,
  vi,
  afterAll,
  afterEach,
  beforeAll,
} from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { cleanup, render } from '@testing-library/react'
import html from 'diffable-html'
import { useGraphStore as useStore } from '@/state/index.ts'
import { Dashboard } from '@/app/dashboard.tsx'

vi.mock('react-router', () => ({
  useNavigate: vi.fn(),
}))
vi.mock('@/components/dashboard-grid/index.tsx', () => ({
  DashboardGrid: 'gui-dashboard-grid',
}))

export const restHandlers = [
  http.get('/dashboard.json', () => {
    return HttpResponse.json([
      {
        name: 'project-foo',
        path: '/home/user/project-foo',
        manifest: { name: 'project-foo', version: '1.0.0' },
        tools: ['node', 'nrz'],
        mtime: 1730498483044,
      },
      {
        name: 'project-bar',
        path: '/home/user/project-bar',
        manifest: { name: 'project-bar', version: '1.0.0' },
        tools: ['pnpm'],
        mtime: 1730498491029,
      },
    ])
  }),
]

const server = setupServer(...restHandlers)

expect.addSnapshotSerializer({
  serialize: v => html(v),
  test: () => true,
})

beforeAll(() => server.listen())

afterEach(() => {
  server.resetHandlers()
  const CleanUp = () => (useStore(state => state.reset)(), '')
  render(<CleanUp />)
  cleanup()
})

afterAll(() => server.close())

test('render default', async () => {
  render(<Dashboard />)
  expect(window.document.body.innerHTML).toMatchSnapshot()
})
