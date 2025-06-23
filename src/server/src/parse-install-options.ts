import { asDepID } from '@nrz/dep-id'
import type {
  AddImportersDependenciesMap,
  Dependency,
  InstallOptions,
} from '@nrz/graph'
import { asDependency } from '@nrz/graph'
import type { SpecOptions } from '@nrz/spec'
import { Spec } from '@nrz/spec'
import type { GUIInstallOptions } from './handle-request.ts'

class AddImportersDependenciesMapImpl
  extends Map
  implements AddImportersDependenciesMap
{
  modifiedDependencies = false
}

export const parseInstallOptions = (
  options: InstallOptions & SpecOptions,
  args: GUIInstallOptions,
): [InstallOptions, AddImportersDependenciesMap] => {
  const addArgs = new AddImportersDependenciesMapImpl()
  for (const [importerId, deps] of Object.entries(args)) {
    const depMap = new Map<string, Dependency>()
    for (const [name, { version, type }] of Object.entries(deps)) {
      depMap.set(
        name,
        asDependency({
          spec: Spec.parse(name, version, options),
          type,
        }),
      )
      addArgs.modifiedDependencies = true
    }
    addArgs.set(asDepID(importerId), depMap)
  }
  return [options, addArgs]
}
