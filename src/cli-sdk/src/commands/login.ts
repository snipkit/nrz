import { RegistryClient } from '@nrz/registry-client'
import { commandUsage } from '../config/usage.ts'
import type { CommandFn, CommandUsage } from '../index.ts'

export const usage: CommandUsage = () =>
  commandUsage({
    command: 'login',
    usage: [''],
    description: `Authenticate against a registry, and store the token in
                  the appropriate config file for later use.`,
  })

export const command: CommandFn<void> = async conf => {
  const rc = new RegistryClient(conf.options)
  await rc.login(conf.options.registry)
}
