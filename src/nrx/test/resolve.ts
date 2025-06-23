import type { PackageInfoClient } from '@nrz/package-info'
import { PackageJson } from '@nrz/package-json'
import type { Spec } from '@nrz/spec'
import { resolve } from 'node:path'
import { PathScurry } from 'path-scurry'
import type { Test } from 'tap'
import t from 'tap'
import type { VlxInfo } from '../src/index.ts'

const mockVlxInstall = (t: Test) => ({
  nrxInstall: async (pkgSpec: Spec): Promise<VlxInfo> => {
    const path = resolve(
      t.testdirName,
      pkgSpec.name === 'abbrev' ? 'abbrevhash' : 'globhash',
    )

    return pkgSpec.name === 'abbrev' ?
        {
          path,
          name: 'abbrev',
          resolved:
            'https://registry.npmjs.org/abbrev/-/abbrev-3.0.1.tgz',
          arg0: undefined,
        }
      : {
          path,
          name: 'glob',
          resolved:
            'https://registry.npmjs.org/glob/-/glob-11.0.1.tgz',
          arg0: 'glob',
        }
  },
})

t.beforeEach(() => (addedToPath.length = 0))
const addedToPath: string[] = []
const mockAddToPATH = {
  addToPATH: (path: string) => addedToPath.push(path),
}

const getVlxResolve = async (t: Test) =>
  await t.mockImport<typeof import('../src/resolve.ts')>(
    '../src/resolve.ts',
    {
      '../src/install.ts': mockVlxInstall(t),
      '../src/add-to-path.ts': mockAddToPATH,
    },
  )

const packageJson = new PackageJson()
const mockPackageInfoClient = {} as unknown as PackageInfoClient

t.test('no pkgOption, no arg, return undefined', async t => {
  const { nrxResolve } = await getVlxResolve(t)
  const projectRoot = t.testdir({})
  const result = await nrxResolve([], {
    projectRoot,
    packageJson,
    scurry: new PathScurry(t.testdirName),
    packageInfo: mockPackageInfoClient,
  })
  t.strictSame(addedToPath, [])
  t.equal(result, undefined)
})

t.test('no pkgOption, has arg, bin found locally', async t => {
  const { nrxResolve } = await getVlxResolve(t)
  const projectRoot = t.testdir({
    node_modules: {
      glob: {
        dist: {
          esm: {
            'bin.mjs': '',
          },
        },
      },
      '.bin': {
        glob: t.fixture('symlink', 'glob/dist/esm/bin.mjs'),
        'glob.cmd': '',
        'glob.ps1': '',
      },
    },
  })
  t.chdir(projectRoot)
  const result = await nrxResolve(['glob'], {
    projectRoot,
    packageJson,
    scurry: new PathScurry(t.testdirName),
    packageInfo: mockPackageInfoClient,
  })
  t.strictSame(addedToPath, [])
  t.equal(result, resolve(projectRoot, 'node_modules/.bin/glob'))
})

t.test('no pkgOption, has arg, not found locally', async t => {
  const { nrxResolve } = await getVlxResolve(t)
  const projectRoot = t.testdir({})
  t.chdir(projectRoot)
  const result = await nrxResolve(['glob'], {
    projectRoot,
    packageJson,
    scurry: new PathScurry(t.testdirName),
    packageInfo: mockPackageInfoClient,
  })
  t.strictSame(addedToPath, [
    resolve(t.testdirName, 'globhash/node_modules/.bin'),
  ])
  t.equal(result, 'glob')
})

t.test('pkgOption is bare, use local', async t => {
  const { nrxResolve } = await getVlxResolve(t)
  const projectRoot = t.testdir({
    node_modules: {
      glob: {
        'package.json': JSON.stringify({
          name: 'glob',
          bin: 'dist/esm/bin.mjs',
        }),
        dist: {
          esm: {
            'bin.mjs': '',
          },
        },
      },
      '.bin': {
        glob: t.fixture('symlink', 'glob/dist/esm/bin.mjs'),
        'glob.cmd': '',
        'glob.ps1': '',
      },
    },
  })
  t.chdir(projectRoot)
  const result = await nrxResolve([], {
    package: 'glob',
    projectRoot,
    packageJson,
    scurry: new PathScurry(t.testdirName),
    packageInfo: mockPackageInfoClient,
  })
  t.strictSame(addedToPath, [
    resolve(projectRoot, 'node_modules/.bin'),
  ])
  t.equal(result, undefined)
})

t.test('pkgOption has version, use global', async t => {
  const { nrxResolve } = await getVlxResolve(t)
  const projectRoot = t.testdir({
    node_modules: {
      glob: {
        'package.json': JSON.stringify({
          name: 'glob',
          bin: 'dist/esm/bin.mjs',
        }),
        dist: {
          esm: {
            'bin.mjs': '',
          },
        },
      },
      '.bin': {
        glob: t.fixture('symlink', 'glob/dist/esm/bin.mjs'),
        'glob.cmd': '',
        'glob.ps1': '',
      },
    },
  })
  t.chdir(projectRoot)
  const result = await nrxResolve(['glob@1.2.3'], {
    projectRoot,
    packageJson,
    scurry: new PathScurry(t.testdirName),
    packageInfo: mockPackageInfoClient,
  })
  t.strictSame(addedToPath, [
    resolve(projectRoot, 'globhash/node_modules/.bin'),
  ])
  t.equal(result, 'glob')
})

t.test('pkgOption has version, use global, cannot infer', async t => {
  const { nrxResolve } = await getVlxResolve(t)
  const projectRoot = t.testdir({
    abbrevhash: {
      node_modules: {
        abbrev: {
          'package.json': JSON.stringify({
            bin: {
              foo: 'bar',
            },
          }),
        },
      },
    },
    node_modules: {
      abbrev: {
        'package.json': JSON.stringify({
          name: 'abbrev',
        }),
      },
    },
  })
  t.chdir(projectRoot)
  await t.rejects(
    nrxResolve(['abbrev@1.2.3'], {
      projectRoot,
      packageJson,
      scurry: new PathScurry(t.testdirName),
      packageInfo: mockPackageInfoClient,
    }),
    {
      message: 'Package executable could not be inferred',
      cause: {
        found: { foo: 'bar' },
      },
    },
  )
  t.strictSame(addedToPath, [
    resolve(t.testdirName, 'abbrevhash/node_modules/.bin'),
  ])
})
