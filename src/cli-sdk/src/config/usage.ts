import { jack } from 'jackspeak'
import type { CommandUsage } from '../index.ts'
import { commandAliases } from './definition.ts'

const toArr = <T>(v: T | T[]): T[] => (Array.isArray(v) ? v : [v])

const code = (v: string) => [v, { pre: true }] as const

const join = (args: (string | undefined)[], joiner = ' ') =>
  args.filter(Boolean).join(joiner)

export type CommandUsageDefinition = {
  command: string
  usage: string | string[]
  description: string
  subcommands?: Record<
    string,
    { usage?: string | string[]; description: string }
  >
  examples?: Record<string, { description: string }>
  options?: Record<string, { value?: string; description: string }>
}

export const commandUsage = ({
  command,
  usage,
  description,
  subcommands,
  examples,
  options,
}: CommandUsageDefinition): ReturnType<CommandUsage> => {
  const nrz = (s?: string) => join([`nrz`, command, s])

  const joinUsage = (usages?: string | string[]) =>
    toArr(usages).map(nrz).filter(Boolean).join('\n')

  const j = jack({ usage: joinUsage(usage) }).description(description)

  const aliases = commandAliases.get(command)
  if (aliases) {
    j.heading('Aliases', 2).description(aliases.join(', '), {
      pre: true,
    })
  }

  if (subcommands) {
    j.heading('Subcommands', 2)
    for (const [k, v] of Object.entries(subcommands)) {
      j.heading(k, 3)
        .description(v.description)
        .description(
          ...code(joinUsage(toArr(v.usage).map(u => join([k, u])))),
        )
    }
  }

  if (examples) {
    j.heading('Examples', 2)
    for (const [k, v] of Object.entries(examples)) {
      j.description(v.description).description(...code(nrz(k)))
    }
  }

  if (options) {
    j.heading('Options', 2)
    for (const [k, v] of Object.entries(options)) {
      j.heading(k, 3)
        .description(v.description)
        .description(
          ...code(
            join(['--', k, v.value ? '=' : undefined, v.value], ''),
          ),
        )
    }
  }

  return j
}
