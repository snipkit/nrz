import { runExec, runExecFG } from '@nrz/run'
import { commandUsage } from '../config/usage.ts'
import type { ExecResult } from '../exec-command.ts'
import { ExecCommand } from '../exec-command.ts'
import type { CommandFn, CommandUsage } from '../index.ts'
export { views } from '../exec-command.ts'

export const usage: CommandUsage = () =>
  commandUsage({
    command: 'run-exec',
    usage: '[command ...]',
    description: `If the first argument is a defined script in package.json, then this is
                  equivalent to \`nrz run\`.

                  If not, then this is equivalent to \`nrz exec\`.`,
  })

export const command: CommandFn<ExecResult> = async conf =>
  await new ExecCommand(conf, runExec, runExecFG).run()
