#!/usr/bin/env -S node --experimental-strip-types --no-warnings

import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import assert from 'node:assert'
import { basename, join, resolve } from 'node:path'
import { bundle } from './bundle.ts'
import { compile } from './compile.ts'
import { BINS } from './bins.ts'
import type { Bin } from './bins.ts'
import { PUBLISHED_VARIANT } from './variants.ts'

const {
  __NRZ_INTERNAL_LOCAL_OPTIONAL_DEPS,
  __NRZ_INTERNAL_COMPILED_BINS,
} = process.env

const COMPILED_BINS = __NRZ_INTERNAL_COMPILED_BINS?.split(',') ?? BINS

const OPTIONAL_DEPS = [
  '@nrz/cli-linux-x64',
  '@nrz/cli-linux-arm64',
  '@nrz/cli-darwin-x64',
  '@nrz/cli-darwin-arm64',
  '@nrz/cli-win32-x64',
]

const OMIT_PKG_KEYS = ['scripts', 'devDependencies', 'publishConfig']

const writeFiles = ({
  outdir,
  pkg,
  pkgExtra,
}: {
  outdir: string
  pkg: object
  pkgExtra?: object
}) => {
  cpSync('./README.md', resolve(outdir, 'README.md'))
  cpSync('./LICENSE', resolve(outdir, 'LICENSE'))
  writeFileSync(
    resolve(outdir, 'package.json'),
    JSON.stringify({ ...pkg, ...pkgExtra }, null, 2),
    'utf8',
  )
}

const omit = <T extends Record<string, unknown>>(
  obj: T,
  keys: string[],
): Omit<T, keyof typeof keys> =>
  Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k)),
  ) as Omit<T, keyof typeof keys>

const parsePackage = () => {
  const rawPkg = JSON.parse(
    readFileSync('./package.json', 'utf8'),
  ) as {
    name: string
    version: string
    publishConfig?: {
      directory?: string
    }
  }

  const outdir = rawPkg.publishConfig?.directory
  assert(outdir, 'missing publishConfig.directory')

  return {
    outdir,
    // Omit from the package.json that gets written to the publish dir
    pkg: omit(rawPkg, OMIT_PKG_KEYS),
    workspaceName: basename(process.cwd()),
  }
}

const main = async () => {
  const { outdir, pkg, workspaceName } = parsePackage()

  rmSync(outdir, { recursive: true, force: true })
  mkdirSync(outdir, { recursive: true })

  const publishedWorkspceName =
    /* c8 ignore next - dont test since this is a constant */
    PUBLISHED_VARIANT === 'Bundle' ? 'cli-js' : 'cli-compiled'
  const cliVariant =
    workspaceName === 'cli' ? publishedWorkspceName : workspaceName

  // The bundled CLI
  if (cliVariant === 'cli-js') {
    await bundle({ outdir, hashbang: true })
    writeFiles({
      outdir,
      pkg,
      pkgExtra: {
        bin: BINS.reduce<Record<string, string>>((acc, bin) => {
          acc[bin] = `./${bin}.js`
          return acc
        }, {}),
      },
    })

    return
  }

  // The compiled root CLI with optional deps
  if (cliVariant === 'cli-compiled') {
    for (const bin of COMPILED_BINS) {
      writeFileSync(
        resolve(outdir, bin),
        '"If this file exists, the postinstall script failed to run."',
      )
    }
    cpSync(
      join(import.meta.dirname, 'postinstall.cjs'),
      resolve(outdir, 'postinstall.cjs'),
    )

    writeFiles({
      outdir,
      pkg,
      pkgExtra: {
        bin: COMPILED_BINS.reduce<Record<string, string>>(
          (acc, bin) => {
            acc[bin] = `./${bin}`
            return acc
          },
          {},
        ),
        optionalDependencies: OPTIONAL_DEPS.reduce<
          Record<string, string>
        >((acc, dep) => {
          // Override to set the optional deps to a local tarball so
          // we can still test the postinstall
          acc[dep] =
            __NRZ_INTERNAL_LOCAL_OPTIONAL_DEPS ?
              `file:./${dep.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`
            : pkg.version
          return acc
        }, {}),
        scripts: {
          postinstall: 'node postinstall.cjs',
        },
      },
    })
    return
  }

  // The platform specific CLIs
  if (/^cli-.+-.+/.exec(cliVariant)) {
    const [, platform, arch] = pkg.name.split('-')
    assert(platform, 'invalid platform in package name')
    assert(arch, 'invalid arch in package name')
    await compile({
      outdir,
      platform,
      arch,
      bins: COMPILED_BINS as Bin[],
    })
    writeFiles({
      outdir,
      pkg,
      pkgExtra: {
        os: [platform],
        cpu: [arch],
        // During a real publish, do not set bins of platform specific
        // packages because they are optional deps of the root package
        // and will be placed by the postinstall script. Setting them
        // here will conflict with the root package bins.
        bin: undefined,
      },
    })
    return
  }

  throw new Error('invalid package name')
}

await main()
