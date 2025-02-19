import { error } from '@nrz/error-cause'
import { loadPackageJson } from 'package-json-from-dist'
import { Config } from './config/index.ts'
import { type Command, type Commands } from './types.ts'
import { stdout, outputCommand } from './output.ts'

const { version } = loadPackageJson(import.meta.filename) as {
  version: string
}

const loadCommand = async <T>(
  command: Commands[keyof Commands] | undefined,
): Promise<Command<T>> => {
  try {
    // Be careful the line between the LOAD COMMANDS comment.
    // infra-build relies on this to work around esbuild bundling dynamic imports
    /* LOAD COMMANDS START */
    return (await import(`./commands/${command}.ts`)) as Command<T>
    /* LOAD COMMANDS STOP */
    /* c8 ignore start - should not be possible, just a failsafe */
  } catch (e) {
    throw error('Could not load command', {
      found: command,
      cause: e,
    })
  }
  /* c8 ignore stop */
}

const run = async () => {
  const start = Date.now()
  const nrz = await Config.load(process.cwd(), process.argv)

  if (nrz.get('version')) {
    return stdout(version)
  }

  const cwd = process.cwd()
  const { monorepo } = nrz.options

  // Infer the workspace by being in that directory.
  if (nrz.get('workspace') === undefined) {
    const ws = monorepo?.get(cwd)
    if (ws) {
      nrz.values.workspace = [ws.path]
      nrz.options.workspace = [ws.path]
    }
  }

  const command = await loadCommand(nrz.command)
  await outputCommand(command, nrz, { start })
}

export default run
