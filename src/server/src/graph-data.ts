import type { ActualLoadOptions } from '@nrz/graph'
import { actual } from '@nrz/graph'
import type { PackageJson } from '@nrz/package-json'
import { SecurityArchive } from '@nrz/security-archive'
import { rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Path, PathBase, PathScurry } from 'path-scurry'
import type { ProjectTools } from './project-tools.ts'
import { inferTools } from './project-tools.ts'

export type GraphDataOptions = ActualLoadOptions

export type GraphProjectData = {
  tools: ProjectTools[]
  nrzInstalled: boolean
}

export const updateGraphData = async (
  options: ActualLoadOptions,
  tmp: string,
  hasDashboard: boolean,
) => {
  const { projectRoot, scurry } = options
  const folder = scurry.lstatSync(projectRoot)
  const result =
    folder ?
      await getGraphData(options, hasDashboard, folder)
    : {
        hasDashboard,
        importers: [],
        lockfile: {},
        projectInfo: {
          tools: [],
          nrzInstalled: false,
        },
        securityArchive: undefined,
      }

  const graphJson = JSON.stringify(result, null, 2)
  rmSync(resolve(tmp, 'graph.json'), { force: true })
  writeFileSync(resolve(tmp, 'graph.json'), graphJson)
}

const getGraphData = async (
  options: ActualLoadOptions,
  hasDashboard: boolean,
  folder: Path,
) => {
  const { packageJson, projectRoot, scurry } = options
  const mainManifest = packageJson.read(projectRoot)
  const graph = actual.load({
    ...options,
    mainManifest,
    loadManifests: true,
  })
  const importers = [...graph.importers]
  const securityArchive = await SecurityArchive.start({
    graph,
    specOptions: options,
  })

  return {
    hasDashboard,
    importers,
    lockfile: graph,
    projectInfo: getProjectData({ packageJson, scurry }, folder),
    securityArchive,
  }
}

const getProjectData = (
  {
    packageJson,
    scurry,
  }: { packageJson: PackageJson; scurry: PathScurry },
  folder: PathBase,
) => {
  return {
    tools: inferTools(
      packageJson.read(folder.fullpath()),
      folder,
      scurry,
    ),
    nrzInstalled:
      !!folder
        .resolve('node_modules/.nrz')
        .lstatSync()
        ?.isDirectory() ||
      !!folder
        .resolve('node_modules/.nrz-lock.json')
        .lstatSync()
        ?.isFile(),
  }
}
