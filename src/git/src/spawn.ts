import { promiseSpawn } from '@nrz/promise-spawn'
import type {
  SpawnResultStderrString,
  SpawnResultStdoutString,
} from '@nrz/promise-spawn'
import promiseRetry from 'promise-retry'
import type { WrapOptions } from 'retry'
import type { GitOptions } from './index.ts'
import { makeError } from './make-error.ts'
import { opts as makeOpts } from './opts.ts'
import { which } from './which.ts'

export const spawn = async (
  gitArgs: string[],
  opts: GitOptions = {},
): Promise<SpawnResultStderrString & SpawnResultStdoutString> => {
  const gitPath = which(opts)

  if (gitPath instanceof Error) {
    throw gitPath
  }

  /* c8 ignore start - undocumented option, only here for tests */
  const args =
    (
      (opts as { allowReplace?: boolean }).allowReplace ||
      gitArgs[0] === '--no-replace-objects'
    ) ?
      gitArgs
    : ['--no-replace-objects', ...gitArgs]
  /* c8 ignore stop */

  const retryOpts: WrapOptions = {
    retries: opts['fetch-retries'] || 3,
    factor: opts['fetch-retry-factor'] || 2,
    maxTimeout: opts['fetch-retry-maxtimeout'] || 60000,
    minTimeout: opts['fetch-retry-mintimeout'] || 1000,
  }
  return promiseRetry(async (retryFn, num) => {
    const result = await promiseSpawn(gitPath, args, makeOpts(opts))
    if (result.status || result.signal) {
      const gitError = makeError(result)
      if (!gitError.shouldRetry(num)) {
        throw gitError
      }
      retryFn(gitError)
    }
    return result
  }, retryOpts)
}
