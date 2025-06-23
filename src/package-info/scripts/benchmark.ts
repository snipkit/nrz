#!/usr/bin/env -S node --experimental-strip-types --no-warnings

import pacote from 'pacote'
import { resolve, join } from 'node:path'
import { parseArgs } from 'node:util'
import { PackageInfoClient } from '../src/index.ts'
import {
  randomPackages,
  convertNs,
  numToFixed,
  resetDir,
  timePromises,
} from '@nrz/benchmark'
import type { UNIT } from '@nrz/benchmark'
import { readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import unzip from '@nrz/cache-unzip/unzip'
import EventEmitter from 'node:events'

process.on('uncaughtException', err => {
  if (err instanceof Error && 'code' in err && err.code === 'EPIPE') {
    // EPIPE is expected when the process is terminated sometimes
  } else {
    throw err
  }
})

const { values } = parseArgs({
  allowNegative: true,
  options: {
    packages: {
      type: 'string',
    },
    benchmark: {
      type: 'string',
      multiple: true,
    },
  },
})

const BENCHMARKS = (
  values.benchmark ?? ['resolve,manifest,extract']
).flatMap(v => v.split(','))
const PACKAGES = randomPackages(
  values.packages ? +values.packages : undefined,
)
const FIXTURES = resolve(tmpdir(), 'fixtures')
const DIRS = {
  nrz: join(FIXTURES, 'nrz-cache'),
  nrzExtract: join(FIXTURES, 'nrz-extract'),
  npm: join(FIXTURES, 'npm-cache'),
  npmExtract: join(FIXTURES, 'npm-extract'),
}

const p = new PackageInfoClient({ cache: DIRS.nrz })

type BenchFn = (
  n: string,
  o?: Record<string, unknown>,
) => Promise<unknown>

interface PackageInfoOptions {
  packages: string[]
  nrz: BenchFn
  npm: BenchFn
}

const CACHE = {
  resetFs: () => {
    resetDir(DIRS.npm)
    resetDir(DIRS.nrz)
  },
  seedFs: async ({ packages, nrz, npm }: PackageInfoOptions) => {
    if (!readdirSync(DIRS.npm).length) {
      await Promise.all(packages.map(n => npm(n)))
    }
    if (!readdirSync(DIRS.nrz).length) {
      const input = new EventEmitter()
      await Promise.all(packages.map(n => nrz(n)))
      // manually do the the cache-unzip task here, to replicate a
      // fs cache that has been fully settled.
      const mp = unzip(DIRS.nrz, input)
      for (const entry of readdirSync(DIRS.nrz)) {
        if (entry.endsWith('.key')) {
          const f = DIRS.nrz + '/' + entry
          const key = readFileSync(f, 'utf8').trim()
          input.emit('data', key + '\0')
        }
      }
      input.emit('end')
      const res = await mp
      if (!res) {
        throw new Error('failed to unzip nrz cache')
      }
    }
  },
  resetMemory: () => {
    p.registryClient.cache.clear()
    // npm has no in-memory cache by default
  },
  seedMemory: async ({ packages, nrz, npm }: PackageInfoOptions) => {
    const packumentCache = new Map<string, unknown>()
    await Promise.all(packages.map(n => npm(n, { packumentCache })))
    await Promise.all(packages.map(n => nrz(n)))
    return {
      npm: { packumentCache },
      nrz: {},
    }
  },
}

const run = async (
  id: string,
  fn: (n: string) => Promise<unknown>,
  packages: string[],
  unit?: UNIT,
) => {
  process.stdout.write(`${id}:`)
  const result = await timePromises(packages, fn)
  const { time, errors, fullErrors } = result
  const elapsed = convertNs(time, unit)
  process.stdout.write(
    numToFixed(elapsed[0], { padStart: 5 }) + elapsed[1],
  )
  if (errors) {
    process.stdout.write(
      ` - errors ${errors}\n${fullErrors.join('\n')}\n`,
    )
  } else {
    process.stdout.write('\n')
  }
  return elapsed[1]
}

const test = async (
  id: 'network' | 'fs' | 'memory',
  { packages, nrz: nrz_, npm: npm_ }: PackageInfoOptions,
) => {
  const nrzOptions = { cache: DIRS.nrz }
  const npmOptions = { cache: DIRS.npm, fullMetadata: true }
  const nrz: BenchFn = (n, o) => nrz_(n, { ...nrzOptions, ...o })
  const npm: BenchFn = (n, o) => npm_(n, { ...npmOptions, ...o })

  switch (id) {
    case 'network':
      CACHE.resetMemory()
      CACHE.resetFs()
      break
    case 'fs':
      await CACHE.seedFs({ packages, nrz, npm })
      CACHE.resetMemory()
      break
    case 'memory': {
      const seeded = await CACHE.seedMemory({ packages, nrz, npm })
      Object.assign(nrzOptions, seeded.nrz)
      Object.assign(npmOptions, seeded.npm)
      CACHE.resetFs()
      break
    }
  }

  const unit = await run(`nrz (${id})`, nrz, packages)
  await run(`npm (${id})`, npm, packages, unit)
}

const compare = async (
  id: 'resolve' | 'manifest' | 'extract',
  {
    max,
    memory = false,
    nrz,
    npm,
  }: {
    max?: number
    memory?: boolean
    nrz: BenchFn
    npm: BenchFn
  },
) => {
  if (!BENCHMARKS.includes(id)) {
    return
  }
  const packages = PACKAGES.slice(0, max ?? PACKAGES.length)
  console.log(`${id} - ${packages.length} packages`)
  const o = { nrz, npm, packages }
  await test('network', o)
  await test('fs', o)
  if (memory) {
    await test('memory', o)
  }
}

console.log('smaller number is better')

resetDir(FIXTURES)

await compare(`resolve`, {
  memory: true,
  nrz: (n, o) => p.resolve(n, o),
  npm: (n, o) => pacote.resolve(n, o),
})

await compare(`manifest`, {
  nrz: (n, o) => p.manifest(n, o),
  npm: (n, o) => pacote.manifest(n, o),
})

await compare(`extract`, {
  // dont extract more than this or else we get rate-limited by the npm registry
  max: 500,
  nrz: (n, o) => p.extract(n, join(DIRS.nrzExtract, n), o),
  npm: (n, o) => pacote.extract(n, join(DIRS.npmExtract, n), o),
})
