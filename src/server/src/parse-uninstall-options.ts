import { asDepID } from '@nrz/dep-id'
import type {
  RemoveImportersDependenciesMap,
  UninstallOptions,
} from '@nrz/graph'
import type { GUIUninstallOptions } from './handle-request.ts'

class RemoveImportersDependenciesMapImpl
  extends Map
  implements RemoveImportersDependenciesMap
{
  modifiedDependencies = false
}

export const parseUninstallOptions = (
  options: UninstallOptions,
  args: GUIUninstallOptions,
): [UninstallOptions, RemoveImportersDependenciesMap] => {
  const removeArgs = new RemoveImportersDependenciesMapImpl()
  for (const [importerId, deps] of Object.entries(args)) {
    const depMap = new Set<string>()
    for (const name of deps) {
      depMap.add(name)
    }
    removeArgs.set(asDepID(importerId), depMap)
    removeArgs.modifiedDependencies = true
  }
  return [options, removeArgs]
}
