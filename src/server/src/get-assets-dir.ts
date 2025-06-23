import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveImport } from 'resolve-import'

export const getAssetsDir = async () =>
  resolve(
    dirname(
      fileURLToPath(
        await resolveImport('@nrz/gui/package.json', import.meta.url),
      ),
    ),
    'dist',
  )
