import { type Token } from '@nrz/registry-client'
import t from 'tap'
import { type LoadedConfig } from '../../src/types.ts'

const log: string[][] = []
const { usage, command } = await t.mockImport<
  typeof import('../../src/commands/token.ts')
>('../../src/commands/token.ts', {
  '@nrz/registry-client': {
    async setToken(reg: string, tok: Token) {
      log.push(['add', reg, tok])
    },
    async deleteToken(reg: string) {
      log.push(['delete', reg])
    },
  },
  '../../src/read-password.js': {
    async readPassword(prompt: string) {
      log.push(['readPassword', prompt])
      return 'result'
    },
  },
})

t.matchSnapshot(usage().usageMarkdown())

await command({
  options: { registry: 'https://registry.nrz.javascript/' },
  positionals: ['add'],
} as unknown as LoadedConfig)

await command({
  options: { registry: 'https://registry.nrz.javascript/' },
  positionals: ['rm'],
} as unknown as LoadedConfig)

t.strictSame(log, [
  ['readPassword', 'Paste bearer token: '],
  ['add', 'https://registry.nrz.javascript', 'Bearer result'],
  ['delete', 'https://registry.nrz.javascript'],
])

t.test('invalid token sub command', async t => {
  await t.rejects(
    command({
      options: { registry: 'https://registry.nrz.javascript/' },
      positionals: ['wat'],
    } as unknown as LoadedConfig),
    { cause: { code: 'EUSAGE' } },
  )
})
