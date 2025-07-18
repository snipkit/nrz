import os, { tmpdir } from 'node:os'
import assert from 'node:assert'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync } from 'node:fs'
import {
  bundle,
  basenameWithoutExtension,
  findEntryBins,
  withoutExtension,
} from './bundle.ts'
import type { Bin } from './bins.ts'

const spawnCompile = ({
  source,
  outdir,
  quiet,
  entry,
  exclude,
  arch,
  platform,
}: {
  source: string
  outdir: string
  quiet?: boolean
  entry: string
  exclude: string[]
  arch: string
  platform: string
}) => {
  const outfile = join(outdir, basenameWithoutExtension(entry))

  const include = readdirSync(source, {
    recursive: true,
    withFileTypes: true,
  })
    .filter(f => f.isFile())
    .map(f => join(f.parentPath, f.name))
    .filter(f => f !== entry && !exclude.includes(f))

  const spawnOptions = {
    command: 'deno',
    args: [
      'compile',
      '-A',
      '--no-remote',
      '--no-npm',
      '--no-check',
      '--no-lock',
      '--unstable-node-globals',
      '--unstable-bare-node-builtins',
      quiet ? '--quiet' : '',
      `--output=${outfile}`,
      `--target=${[
        {
          arm64: 'aarch64',
          x64: 'x86_64',
        }[arch],
        {
          linux: 'unknown-linux-gnu',
          win32: 'pc-windows-msvc',
          darwin: 'apple-darwin',
        }[platform],
      ].join('-')}`,
      ...include
        // deno doesnt support source maps in compiled binaries
        // https://github.com/denoland/deno/issues/4499
        .filter(f => !f.endsWith('.js.map'))
        .map(i => `--include=${i}`),
      entry,
    ],
  }

  const res = spawnSync(spawnOptions.command, spawnOptions.args, {
    shell: true,
    encoding: 'utf8',
    stdio: 'inherit',
  })
  assert(
    res.status === 0,
    new Error('compile error', {
      cause: {
        ...res,
        command: spawnOptions.command,
        args: spawnOptions.args,
      },
    }),
  )

  const compiledOutfile = readdirSync(outdir).find(
    f =>
      basenameWithoutExtension(f) === basenameWithoutExtension(entry),
  )
  assert(compiledOutfile, 'no compiled file found')
  return join(outdir, compiledOutfile)
}

export type Options = {
  outdir: string
  quiet?: boolean
  bins?: readonly Bin[]
  arch?: string
  platform?: string
}

export const compile = async ({
  outdir,
  quiet,
  bins,
  arch = os.arch(),
  platform = os.platform(),
}: Options) => {
  mkdirSync(outdir, { recursive: true })

  const { outdir: source } = await bundle({
    outdir: resolve(
      tmpdir(),
      `nrz-bundle-${Math.random().toString().slice(2, 10)}`,
    ),
    internalDefine: {
      COMPILED: 'true',
    },
  })

  assert(source, 'source is required')

  const entries = findEntryBins(source, bins)
  assert(entries.length, 'no bins found')

  const files: string[] = []
  for (const entry of entries) {
    files.push(
      spawnCompile({
        source,
        outdir,
        quiet,
        entry,
        exclude: entries
          .filter(b => b !== entry)
          .map(b => withoutExtension(b))
          .flatMap(b => [`${b}.js`, `${b}.js.map`]),
        arch,
        platform,
      }),
    )
  }

  return { outdir, files }
}
