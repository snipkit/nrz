import t from 'tap'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

t.test('basic', async t => {
  const { compile } = await t.mockImport<
    typeof import('../src/compile.ts')
  >('../src/compile.ts')
  const dir = t.testdir()
  const res = await compile({
    outdir: dir,
    bins: ['nrz'],
    quiet: true,
  })
  const contents = readdirSync(res.outdir)
  t.ok(
    contents.includes(
      `nrz${process.platform === 'win32' ? '.exe' : ''}`,
    ),
  )
  t.notOk(
    contents.includes(
      `nrr${process.platform === 'win32' ? '.exe' : ''}`,
    ),
  )
})

t.test('not quiet', async t => {
  const dir = t.testdir()
  let spawnArgs: string[] = []
  const { compile } = await t.mockImport<
    typeof import('../src/compile.ts')
  >('../src/compile.ts', {
    'node:child_process': {
      spawnSync: (_: string, args: string[]) => {
        spawnArgs = args
        writeFileSync(join(dir, 'nrz'), '')
        return { status: 0 }
      },
    },
  })
  await compile({
    outdir: dir,
    bins: ['nrz'],
  })
  t.notOk(spawnArgs.includes('--quiet'))
})
