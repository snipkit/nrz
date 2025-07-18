import { resolve } from 'node:path'
import type { Commands } from '@nrz/cli-sdk/definition'

export const BINS_DIR = resolve(import.meta.dirname, 'bins')

export const BINS = ['nrxl', 'nrr', 'nrrx', 'nrz', 'nrx'] as const

export type Bin = (typeof BINS)[number]

export const isBin = (value: unknown): value is Bin =>
  BINS.includes(value as Bin)

export const run = async (command?: keyof Commands) => {
  if (process.env.__NRZ_INTERNAL_MAIN) {
    // When compiled, spawned processes are run as scripts at specific paths
    // within the bin and set as an environment variable. So we read from the
    // env, set it as a global and then delete so that it wont get stuck in a
    // loop in case the script calls the main entry point again.
    const g = globalThis as typeof globalThis & {
      __NRZ_INTERNAL_MAIN?: string
    }
    g.__NRZ_INTERNAL_MAIN = process.env.__NRZ_INTERNAL_MAIN
    delete process.env.__NRZ_INTERNAL_MAIN
    await import(g.__NRZ_INTERNAL_MAIN)
  } else {
    if (command) {
      process.argv.splice(2, 0, command)
    }
    const nrz = await import('@nrz/cli-sdk')
    await nrz.default()
  }
}
