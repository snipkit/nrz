import t from 'tap'
import type { LoadedConfig } from '../../src/config/index.ts'
let loginCalled = ''

const { usage, command } = await t.mockImport<
  typeof import('../../src/commands/login.ts')
>('../../src/commands/login.ts', {
  '@nrz/registry-client': {
    RegistryClient: class {
      async login(registry: string) {
        loginCalled = registry
      }
    },
  },
})

t.matchSnapshot(usage().usageMarkdown())
await command({
  options: { registry: 'registry' },
} as LoadedConfig)
t.equal(loginCalled, 'registry')
