import t from 'tap'
import type { Test } from 'tap'
import { join } from 'node:path'

const mockBins = (t: Test, mocks?: Record<string, any>) =>
  t.mockImport<typeof import('../src/bins.ts')>(
    '../src/bins.ts',
    mocks,
  )

t.test('basic', async t => {
  const { BINS, BINS_DIR, isBin } = await mockBins(t)
  t.type(BINS_DIR, 'string')
  t.strictSame(BINS, ['nrxl', 'nrr', 'nrrx', 'nrz', 'nrx'])

  t.ok(isBin('nrz'))
  t.notOk(isBin('nrzt'))
})

t.test('changes argv', async t => {
  t.intercept(process, 'argv', { value: ['a', 'b', 'c', 'd'] })
  const runFn = () => true
  const cliSdk = t.captureFn(runFn)
  const { run } = await mockBins(t, { '@nrz/cli-sdk': cliSdk })
  await run('exec')
  t.strictSame(process.argv, ['a', 'b', 'exec', 'c', 'd'])
  t.strictSame(cliSdk.args(), [[]])
})

t.test('with internal main', async t => {
  const logs = t.capture(console, 'log').args
  const dir = t.testdir({
    'main.js': `console.log('running main')`,
  })
  const main = join(dir, 'main.js')
  t.intercept(process, 'env', {
    value: { __NRZ_INTERNAL_MAIN: main },
  })
  const { run } = await mockBins(t)
  await run()
  t.strictSame(logs(), [['running main']])
  t.equal(process.env.__NRZ_INTERNAL_MAIN, undefined)
  t.equal(
    (
      globalThis as typeof globalThis & {
        __NRZ_INTERNAL_MAIN?: string
      }
    ).__NRZ_INTERNAL_MAIN,
    main,
  )
})
