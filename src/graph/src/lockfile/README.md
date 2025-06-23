# @nrz/graph.lockfile

A library that stores `@nrz/graph.Graph` information into a lockfile
and reads information from stored lockfiles to rebuild a virtual
`Graph`.

## USAGE

```js
import { lockfile } from '@nrz/graph'
import { PackageJson } from '@nrz/package-json'

const projectRoot = '/path/to/my-project'
const packageJson = new PackageJson()
const mainManifest = await packageJson.read(projectRoot)
const graph = lockfile.load({
  projectRoot,
  mainManifest,
})

console.log(graph)
```
