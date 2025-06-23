import type { NrzServerListening } from '@nrz/server'
import { createServer } from '@nrz/server'
import { urlOpen } from '@nrz/url-open'
import type { PathScurry } from 'path-scurry'
import type { LoadedConfig } from './config/index.ts'
import { stdout } from './output.ts'
import { resolve } from 'node:path'

export const getDefaultStartingRoute = async (options: {
  startingRoute?: string
  projectRoot: string
  scurry: PathScurry
}) => {
  const { startingRoute, projectRoot, scurry } = options
  if (startingRoute) return startingRoute
  const stat = await scurry.lstat(`${projectRoot}/package.json`)
  return stat?.isFile() && !stat.isSymbolicLink() ?
      `/explore?query=${encodeURIComponent(':root')}`
    : '/'
}

const getAssetsDir = () => {
  /* c8 ignore start */
  if (process.env.__NRZ_INTERNAL_GUI_ASSETS_DIR) {
    return resolve(
      import.meta.dirname,
      process.env.__NRZ_INTERNAL_GUI_ASSETS_DIR,
    )
  }
  /* c8 ignore stop */
}

export const startGUI = async (
  conf: LoadedConfig,
  startingRoute?: string,
) => {
  const server = createServer({
    ...conf.options,
    assetsDir: getAssetsDir(),
  })
  server.on('needConfigUpdate', dir => {
    conf.resetOptions(dir)
    ;(server as NrzServerListening).updateOptions(conf.options)
  })
  const { projectRoot, scurry } = conf.options
  await server.start()
  stdout(`⚡️ nrz GUI running at ${server.address()}`)
  void urlOpen(
    server.address(
      await getDefaultStartingRoute({
        startingRoute,
        projectRoot,
        scurry,
      }),
    ),
  )
  return server
}
