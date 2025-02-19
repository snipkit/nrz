import assert from 'node:assert'
import t, { type Test } from 'tap'

const benchmark = async (t: Test, ...argv: string[]) => {
  const dir = t.testdir()
  t.capture(console, 'log')
  t.intercept(process, 'argv', {
    value: [
      process.execPath,
      'benchmark.js',
      `--outdir=${dir}`,
      ...argv,
    ],
  })
  let args: string[] = []
  await t.mockImport<typeof import('../../src/bin/benchmark.ts')>(
    '../../src/bin/benchmark.ts',
    {
      'node:child_process': {
        spawnSync: (_: any, a: string[]) => (args = a),
      },
      '../../src/matrix.js': await t.mockImport(
        '../../src/matrix.ts',
        {
          '../../src/compile.js': {
            default: () => {},
          },
          '../../src/bundle.js': {
            default: () => {},
          },
        },
      ),
    },
  )
  const benchmarkArg = args.at(-2)
  assert(benchmarkArg, 'has benchmark arg')
  return benchmarkArg.replaceAll('"', '').split(',')
}

t.test('basic', async t => {
  const args = await benchmark(
    t,
    '--runtime=node,bun,deno',
    '--compile=true,false',
  )
  t.ok(args.find(a => /^node.*nrz\.js$/.exec(a)))
  t.ok(args.find(a => /^bun.*nrz\.js$/.exec(a)))
  t.ok(args.find(a => /^deno run -A.*nrz\.js$/.exec(a)))
  t.ok(args.find(a => /compile-.*deno.*nrz$/.exec(a)))
  t.ok(args.find(a => /compile-.*bun.*nrz$/.exec(a)))
})

t.test('nothing', async t => {
  await t.rejects(benchmark(t, '--runtime=node', '--compile=true'), {
    message: 'no benchmark matrix generated for supplied options',
  })
})
