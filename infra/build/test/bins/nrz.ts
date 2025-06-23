import t from 'tap'

t.test('basic', async t => {
  const run = t.captureFn(() => {})
  await t.mockImport<typeof import('../../src/bins/nrz.ts')>(
    '../../src/bins/nrz.ts',
    {
      '../../src/bins.ts': { run },
    },
  )
  t.strictSame(run.args(), [[]])
})
