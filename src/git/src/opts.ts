// Values we want to set if they're not already defined by the end user

import type {
  PromiseSpawnOptionsStderrString,
  PromiseSpawnOptionsStdoutString,
} from '@nrz/promise-spawn'
import type { SpawnOptions } from 'node:child_process'

// This defaults to accepting new ssh host key fingerprints
const gitEnv = {
  GIT_ASKPASS: 'echo',
  GIT_SSH_COMMAND: 'ssh -oStrictHostKeyChecking=accept-new',
}

export const opts = (
  opts: SpawnOptions = {},
): PromiseSpawnOptionsStderrString &
  PromiseSpawnOptionsStdoutString => ({
  acceptFail: true,
  ...opts,
  env: opts.env ?? { ...gitEnv, ...process.env },
  stdio: 'pipe',
  stdioString: true,
  shell: false,
})
