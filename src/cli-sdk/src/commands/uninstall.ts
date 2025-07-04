import { uninstall } from '@nrz/graph'
import type { Graph } from '@nrz/graph'
import { commandUsage } from '../config/usage.ts'
import type { CommandFn, CommandUsage } from '../index.ts'
import { parseRemoveArgs } from '../parse-add-remove-args.ts'
import { InstallReporter } from './install/reporter.ts'
import type { Views } from '../view.ts'

export const usage: CommandUsage = () =>
  commandUsage({
    command: 'uninstall',
    usage: '[package ...]',
    description: `The opposite of \`nrz install\`. Removes deps and updates
                  nrz-lock.json and package.json appropriately.`,
  })

export const views = {
  json: g => g.toJSON(),
  human: InstallReporter,
} as const satisfies Views<Graph>

export const command: CommandFn<Graph> = async conf => {
  const monorepo = conf.options.monorepo
  const { remove } = parseRemoveArgs(conf, monorepo)
  const { graph } = await uninstall(conf.options, remove)
  return graph
}
