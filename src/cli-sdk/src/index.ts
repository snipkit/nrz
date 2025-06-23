import { format } from 'node:util'
import { asRootError } from '@nrz/output/error'
import { loadPackageJson } from 'package-json-from-dist'
import {
  getSortedCliOptions,
  getSortedKeys,
} from './config/definition.ts'
import { Config } from './config/index.ts'
import { outputCommand, stderr, stdout } from './output.ts'
import { indent } from './print-err.ts'
import { loadCommand } from './load-command.ts'

export type {
  Command,
  CommandFn,
  CommandUsage,
} from './load-command.ts'

const { version } = loadPackageJson(
  import.meta.filename,
  process.env.__NRZ_INTERNAL_CLI_PACKAGE_JSON,
) as {
  version: string
}

const loadNrz = async (cwd: string, argv: string[]) => {
  try {
    return await Config.load(cwd, argv)
  } catch (e) {
    const err = asRootError(e, { code: 'JACKSPEAK' })
    const { found, path, wanted, name } = err.cause
    const isConfigFile = typeof path === 'string'
    const msg =
      isConfigFile ?
        `Problem in Config File ${path}`
      : 'Invalid Option Flag'
    const validOptions =
      wanted ? undefined
      : isConfigFile ? getSortedKeys()
      : getSortedCliOptions()
    stderr(msg)
    stderr(err.message)
    if (name) stderr(indent(`Field: ${format(name)}`))
    if (found) {
      stderr(
        indent(
          `Found: ${isConfigFile ? JSON.stringify(found) : format(found)}`,
        ),
      )
    }
    if (wanted) stderr(indent(`Wanted: ${format(wanted)}`))
    if (validOptions) {
      stderr(indent('Valid Options:'))
      stderr(indent(validOptions.join('\n'), 4))
    }
    stderr(
      indent(
        `Run 'nrz help' for more information about available options.`,
      ),
    )
    return process.exit(process.exitCode || 1)
  }
}

const run = async () => {
  const start = Date.now()
  const cwd = process.cwd()
  const nrz = await loadNrz(cwd, process.argv)

  if (nrz.get('version')) {
    return stdout(version)
  }

  const { monorepo } = nrz.options

  // Infer the workspace by being in that directory.
  if (nrz.get('workspace') === undefined) {
    const ws = monorepo?.get(cwd)
    if (ws) {
      nrz.values.workspace = [ws.path]
      nrz.options.workspace = [ws.path]
    }
  }

  if (
    (nrz.get('workspace') || nrz.get('workspace-group')) &&
    ![...(monorepo?.values() ?? [])].length
  ) {
    stderr(
      `Error: No matching workspaces found. Make sure the nrz.json config contains the correct workspaces.`,
    )
    if (nrz.get('workspace')) {
      stderr(indent(`Workspace: ${format(nrz.get('workspace'))}`))
    }
    if (nrz.get('workspace-group')) {
      stderr(
        indent(
          `Workspace Group: ${format(nrz.get('workspace-group'))}`,
        ),
      )
    }
    return process.exit(process.exitCode || 1)
  }

  const command = await loadCommand(nrz.command)
  await outputCommand(command, nrz, { start })
}

export default run
