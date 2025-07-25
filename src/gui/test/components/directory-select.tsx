import { vi, expect, afterEach, describe, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import html from 'diffable-html'
import { useGraphStore as useStore } from '@/state/index.ts'
import { DirectorySelect } from '@/components/directory-select.tsx'
import type { DashboardData } from '@/state/types.ts'

vi.mock('@/components/ui/popover.tsx', () => ({
  Popover: 'gui-popover',
  PopoverTrigger: 'gui-popover-trigger',
  PopoverContent: 'gui-popover-content',
}))

vi.mock('@/components/ui/command.tsx', () => ({
  Command: 'gui-command',
  CommandEmpty: 'gui-command-empty',
  CommandGroup: 'gui-command-group',
  CommandInput: 'gui-command-input',
  CommandItem: 'gui-command-item',
  CommandList: 'gui-command-list',
}))

vi.mock('@/components/ui/button.tsx', () => ({
  Button: 'gui-button',
}))

vi.mock('lucide-react', () => ({
  ChevronDown: 'gui-chevron-down-icon',
  Check: 'gui-check-icon',
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

describe('directory select', () => {
  it('renders correctly', () => {
    const mockSetDirectory = vi.fn()
    const mockDirectory = ''

    const mockDashboard = {
      cwd: '/home/user',
      defaultAuthor: 'Ruy Adorno',
      dashboardProjectLocations: [
        { path: '/home/user', readablePath: '~' },
      ],
      projects: [
        {
          name: 'project-foo',
          readablePath: '~/project-foo',
          path: '/home/user/project-foo',
          manifest: { name: 'project-foo', version: '1.0.0' },
          tools: ['node', 'nrz'],
          mtime: 1730498483044,
        },
        {
          name: 'project-bar',
          readablePath: '~/project-foo',
          path: '/home/user/project-bar',
          manifest: { name: 'project-bar', version: '1.0.0' },
          tools: ['node', 'nrz'],
          mtime: 1730498491029,
        },
      ],
    } satisfies DashboardData

    const Container = () => {
      return (
        <DirectorySelect
          directory={mockDirectory}
          setDirectory={mockSetDirectory}
          dashboard={mockDashboard}
        />
      )
    }

    const { container } = render(<Container />)
    expect(container.innerHTML).toMatchSnapshot()
  })
})
