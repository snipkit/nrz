import { error } from '@nrz/error-cause'
import type { Manifest } from '@nrz/types'
import type { PathBase, PathScurry } from 'path-scurry'

export type ProjectTools =
  | 'nrz'
  | 'node'
  | 'deno'
  | 'bun'
  | 'npm'
  | 'pnpm'
  | 'yarn'
  | 'js'

const knownTools = new Map<ProjectTools, string[]>([
  [
    'nrz',
    [
      'nrz-lock.json',
      'nrz.json',
      'node_modules/.nrz',
      'node_modules/.nrz-lock.json',
    ],
  ],
  ['node', []],
  ['deno', ['deno.json']],
  ['bun', ['bun.lockb', 'bunfig.toml']],
  ['npm', ['package-lock.json', 'node_modules/.package-lock.json']],
  [
    'pnpm',
    ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'node_modules/.pnpm'],
  ],
  ['yarn', ['yarn.lock']],
])

export const isProjectTools = (str: string): str is ProjectTools =>
  knownTools.has(str as ProjectTools)

export const asProjectTools = (str: string): ProjectTools => {
  if (!isProjectTools(str)) {
    throw error('Invalid dashboard tool', {
      found: str,
      validOptions: [...knownTools.keys()],
    })
  }
  return str
}

export const inferTools = (
  manifest: Manifest,
  folder: PathBase,
  scurry: PathScurry,
) => {
  const tools: ProjectTools[] = []
  // check if known tools names are found in the manifest file
  for (const knownName of knownTools.keys()) {
    if (
      Object.hasOwn(manifest, knownName) ||
      (manifest.engines && Object.hasOwn(manifest.engines, knownName))
    ) {
      tools.push(asProjectTools(knownName))
    }
  }

  // check for known file names
  for (const [knownName, files] of knownTools) {
    for (const file of files) {
      if (scurry.lstatSync(folder.resolve(file))) {
        tools.push(asProjectTools(knownName))
        break
      }
    }
  }

  // defaults to js if no tools are found
  if (tools.length === 0) {
    tools.push('js')
  }
  return tools
}
