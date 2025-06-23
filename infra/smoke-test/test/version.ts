import t from 'tap'
import { runMultiple } from './fixtures/run.ts'
import Cli from '@nrz/cli-sdk/package.json' with { type: 'json' }

t.test('--version', async t => {
  const { stdout } = await runMultiple(t, ['--version'])
  t.equal(stdout, Cli.version)
})
