import { PackageJson } from '@nrz/package-json'
import type { Manifest } from '@nrz/types'
import { resolve } from 'node:path'
import t from 'tap'
import type { VlxManifest, VlxOptions } from '../src/index.ts'

const { nrxInfo } = await t.mockImport<
  typeof import('../src/info.ts')
>('../src/info.ts', {
  '../src/mount-path.ts': {
    mountPath: (_: string, path: string) => path,
  },
})

const options = {
  packageJson: new PackageJson(),
} as unknown as VlxOptions

const rootDepManifest: VlxManifest = {
  name: 'nrx',
  dependencies: {
    dep: 'https://registry.npmjs.org/dep/-/dep-1.2.3.tgz',
  },
  nrx: {
    integrity: 'sha512-yabbadabbadoodddle',
  },
  [Symbol.for('indent')]: '',
  [Symbol.for('newline')]: '',
}

const rootNobinManifest: Manifest = {
  name: 'nrx',
  dependencies: {
    nobin: 'https://registry.npmjs.org/nobin/-/nobin-1.2.3.tgz',
  },
  [Symbol.for('indent')]: '',
  [Symbol.for('newline')]: '',
}

const dir = t.testdir({
  hashdep: {
    'package.json': JSON.stringify(rootDepManifest),
    node_modules: {
      dep: {
        'package.json': JSON.stringify({
          name: 'dep',
          version: '1.2.3',
          bin: 'dep.js',
        }),
      },
    },
  },
  hashnobin: {
    'package.json': JSON.stringify(rootNobinManifest),
    node_modules: {
      nobin: {
        'package.json': JSON.stringify({
          name: 'nobin',
          version: '1.2.3',
        }),
      },
    },
  },
  hashbroken: {
    'package.json': JSON.stringify({}),
  },
  missingdep: {
    'package.json': JSON.stringify({
      dependencies: {
        missing: '',
      },
    }),
  },
})

t.strictSame(
  nrxInfo(resolve(dir, 'hashdep'), options, rootDepManifest),
  {
    path: resolve(dir, 'hashdep'),
    name: 'dep',
    version: '1.2.3',
    resolved: 'https://registry.npmjs.org/dep/-/dep-1.2.3.tgz',
    arg0: 'dep',
    integrity: 'sha512-yabbadabbadoodddle',
  },
)

t.strictSame(nrxInfo(resolve(dir, 'hashnobin'), options), {
  path: resolve(dir, 'hashnobin'),
  name: 'nobin',
  version: '1.2.3',
  resolved: 'https://registry.npmjs.org/nobin/-/nobin-1.2.3.tgz',
  arg0: undefined,
})

t.throws(() => nrxInfo(resolve(dir, 'hashbroken'), options))
t.throws(() => nrxInfo(resolve(dir, 'missingdep'), options))
t.throws(() => nrxInfo(resolve(dir, 'not-even-there'), options))
