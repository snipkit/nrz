import t from 'tap'
import type { Test } from 'tap'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as Bundle from '../src/bundle.ts'
import * as Compile from '../src/compile.ts'
import { PUBLISHED_VARIANT } from '../src/variants.ts'

const mockCli = async (
  t: Test,
  {
    workspaceName,
    argv = [],
    pkg,
  }: {
    workspaceName: string
    argv?: string[]
    pkg?: Record<string, string | object>
  },
) => {
  const testdir = t.testdir({
    [workspaceName]: {
      'package.json': JSON.stringify({
        name: 'my-published-package',
        version: '1.2.3',
        description: 'hi',
        repository: 'my-repo',
        keywords: ['hi'],
        type: 'module',
        license: 'MIT',
        scripts: { dont_copy_this: 'hi' },
        devDependencies: { dont_copy_this: 'hi' },
        ...pkg,
      }),
      'README.md': 'hi',
      LICENSE: 'hi',
      'postinstall.cjs': 'hi',
      'placeholder-bin.js': 'hi',
    },
  })
  const dir = join(testdir, workspaceName)

  t.chdir(dir)
  t.intercept(process, 'argv', {
    value: [
      process.execPath,
      resolve(import.meta.dirname, '../src/prepack.ts'),
      ...argv,
    ],
  })

  const calls: {
    bundle: Bundle.Options[]
    compile: Compile.Options[]
  } = {
    bundle: [],
    compile: [],
  }

  await t.mockImport<typeof import('../src/prepack.ts')>(
    '../src/prepack.ts',
    {
      '../src/bundle.ts': t.createMock(Bundle, {
        bundle: async (o: Bundle.Options) => {
          calls.bundle.push(o)
          return o
        },
      }),
      '../src/compile.ts': t.createMock(Compile, {
        compile: async (o: Compile.Options) => {
          calls.compile.push(o)
          return o
        },
      }),
    },
  )

  return {
    dir,
    calls,
    readOutdir: (p: string) => readdirSync(join(dir, p)).sort(),
    readPkg: (p: string) =>
      JSON.parse(readFileSync(join(dir, p, 'package.json'), 'utf8')),
  }
}

t.test('invalid name', async t => {
  await t.rejects(
    mockCli(t, {
      workspaceName: 'bad-name',
      pkg: { publishConfig: { directory: 'ok' } },
    }),
  )
})

t.test('bundled and compiled', async t => {
  const testBundled = async (t: Test, workspaceName = 'cli-js') => {
    const dir = 'outdir'
    const { readPkg, readOutdir } = await mockCli(t, {
      workspaceName,
      pkg: {
        publishConfig: {
          directory: dir,
        },
      },
    })
    t.strictSame(readPkg(dir), {
      name: 'my-published-package',
      version: '1.2.3',
      description: 'hi',
      repository: 'my-repo',
      keywords: ['hi'],
      type: 'module',
      license: 'MIT',
      bin: {
        nrxl: './nrxl.js',
        nrr: './nrr.js',
        nrrx: './nrrx.js',
        nrz: './nrz.js',
        nrx: './nrx.js',
      },
    })
    t.strictSame(
      readOutdir(dir),
      ['LICENSE', 'README.md', 'package.json'].sort(),
    )
  }

  const testCompiled = async (
    t: Test,
    workspaceName = 'cli-compiled',
  ) => {
    const dir = 'outdir'
    const { readPkg, readOutdir } = await mockCli(t, {
      workspaceName,
      pkg: {
        publishConfig: {
          directory: dir,
        },
      },
    })
    t.strictSame(readPkg(dir), {
      name: 'my-published-package',
      version: '1.2.3',
      description: 'hi',
      repository: 'my-repo',
      keywords: ['hi'],
      type: 'module',
      license: 'MIT',
      bin: {
        nrxl: './nrxl',
        nrr: './nrr',
        nrrx: './nrrx',
        nrz: './nrz',
        nrx: './nrx',
      },
      optionalDependencies: {
        '@nrz/cli-linux-x64': '1.2.3',
        '@nrz/cli-linux-arm64': '1.2.3',
        '@nrz/cli-darwin-x64': '1.2.3',
        '@nrz/cli-darwin-arm64': '1.2.3',
        '@nrz/cli-win32-x64': '1.2.3',
      },
      scripts: {
        postinstall: 'node postinstall.cjs',
      },
    })
    t.strictSame(
      readOutdir(dir),
      [
        'LICENSE',
        'README.md',
        'package.json',
        'nrxl',
        'nrr',
        'nrrx',
        'nrz',
        'nrx',
        'postinstall.cjs',
      ].sort(),
    )
  }

  t.test('bundled', t => testBundled(t))
  t.test('compiled', t => testCompiled(t))
  t.test('published', t =>
    PUBLISHED_VARIANT === 'Bundle' ?
      testBundled(t, 'cli')
    : testCompiled(t, 'cli'),
  )
})

t.test('root compiled bin', async t => {
  const dir = 'outdir'
  const mockRootBin = (t: Test) =>
    mockCli(t, {
      workspaceName: 'cli-compiled',
      pkg: {
        publishConfig: {
          directory: dir,
        },
      },
    })

  t.test('override optional deps', async t => {
    t.intercept(process, 'env', {
      value: {
        ...process.env,
        __NRZ_INTERNAL_LOCAL_OPTIONAL_DEPS: '1',
      },
    })
    const { readOutdir, readPkg } = await mockRootBin(t)
    t.strictSame(readPkg(dir), {
      name: 'my-published-package',
      version: '1.2.3',
      description: 'hi',
      repository: 'my-repo',
      keywords: ['hi'],
      type: 'module',
      license: 'MIT',
      bin: {
        nrxl: './nrxl',
        nrr: './nrr',
        nrrx: './nrrx',
        nrz: './nrz',
        nrx: './nrx',
      },
      optionalDependencies: {
        '@nrz/cli-linux-x64': 'file:./nrz-cli-linux-x64-1.2.3.tgz',
        '@nrz/cli-linux-arm64':
          'file:./nrz-cli-linux-arm64-1.2.3.tgz',
        '@nrz/cli-darwin-x64': 'file:./nrz-cli-darwin-x64-1.2.3.tgz',
        '@nrz/cli-darwin-arm64':
          'file:./nrz-cli-darwin-arm64-1.2.3.tgz',
        '@nrz/cli-win32-x64': 'file:./nrz-cli-win32-x64-1.2.3.tgz',
      },
      scripts: {
        postinstall: 'node postinstall.cjs',
      },
    })
    t.strictSame(
      readOutdir(dir),
      [
        'LICENSE',
        'README.md',
        'package.json',
        'nrxl',
        'nrr',
        'nrrx',
        'nrz',
        'nrx',
        'postinstall.cjs',
      ].sort(),
    )
  })

  t.test('limit which bins to create', async t => {
    t.intercept(process, 'env', {
      value: {
        ...process.env,
        __NRZ_INTERNAL_COMPILED_BINS: 'nrz,nrr',
      },
    })
    const { readOutdir, readPkg } = await mockRootBin(t)
    t.strictSame(readPkg(dir), {
      name: 'my-published-package',
      version: '1.2.3',
      description: 'hi',
      repository: 'my-repo',
      keywords: ['hi'],
      type: 'module',
      license: 'MIT',
      bin: {
        nrr: './nrr',
        nrz: './nrz',
      },
      optionalDependencies: {
        '@nrz/cli-linux-x64': '1.2.3',
        '@nrz/cli-linux-arm64': '1.2.3',
        '@nrz/cli-darwin-x64': '1.2.3',
        '@nrz/cli-darwin-arm64': '1.2.3',
        '@nrz/cli-win32-x64': '1.2.3',
      },
      scripts: {
        postinstall: 'node postinstall.cjs',
      },
    })
    t.strictSame(
      readOutdir(dir),
      [
        'LICENSE',
        'README.md',
        'package.json',
        'nrr',
        'nrz',
        'postinstall.cjs',
      ].sort(),
    )
  })
})

t.test('platform bin', async t => {
  const dir = 'outdir'
  const mockPlatformBin = (t: Test) =>
    mockCli(t, {
      workspaceName: 'cli-darwin-x64',
      pkg: {
        name: '@nrz/cli-darwin-x64',
        publishConfig: {
          directory: dir,
        },
      },
    })

  t.test('limit which bins to create', async t => {
    t.intercept(process, 'env', {
      value: {
        ...process.env,
        __NRZ_INTERNAL_COMPILED_BINS: 'nrz,nrr',
      },
    })
    const { readOutdir, readPkg, calls } = await mockPlatformBin(t)
    t.strictSame(calls.compile[0]?.bins, ['nrz', 'nrr'])
    t.strictSame(readPkg(dir), {
      name: '@nrz/cli-darwin-x64',
      version: '1.2.3',
      description: 'hi',
      repository: 'my-repo',
      keywords: ['hi'],
      type: 'module',
      license: 'MIT',
      os: ['darwin'],
      cpu: ['x64'],
    })
    t.strictSame(
      readOutdir(dir),
      ['LICENSE', 'README.md', 'package.json'].sort(),
    )
  })

  t.test('publish', async t => {
    const { readOutdir, readPkg, calls } = await mockPlatformBin(t)
    t.strictSame(calls.compile[0]?.bins, [
      'nrxl',
      'nrr',
      'nrrx',
      'nrz',
      'nrx',
    ])
    t.strictSame(readPkg(dir), {
      name: '@nrz/cli-darwin-x64',
      version: '1.2.3',
      description: 'hi',
      repository: 'my-repo',
      keywords: ['hi'],
      type: 'module',
      license: 'MIT',
      os: ['darwin'],
      cpu: ['x64'],
    })
    t.strictSame(
      readOutdir(dir),
      ['LICENSE', 'README.md', 'package.json'].sort(),
    )
  })
})
