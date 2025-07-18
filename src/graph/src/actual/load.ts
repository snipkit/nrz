import {
  asDepID,
  hydrate,
  joinDepIDTuple,
  splitDepID,
} from '@nrz/dep-id'
import type { DepID } from '@nrz/dep-id'
import type { PackageJson } from '@nrz/package-json'
import { Spec } from '@nrz/spec'
import type { SpecOptions } from '@nrz/spec'
import { longDependencyTypes } from '@nrz/types'
import type { Manifest } from '@nrz/types'
import type { Monorepo } from '@nrz/workspaces'
import type { Path, PathScurry } from 'path-scurry'
import { shorten } from '../dependencies.ts'
import type { RawDependency } from '../dependencies.ts'
import { Graph } from '../graph.ts'
import { loadHidden } from '../lockfile/load.ts'
import type { Node } from '../node.ts'
import { graphStep } from '@nrz/output'

export type LoadOptions = SpecOptions & {
  /**
   * The project root dirname.
   */
  projectRoot: string
  /**
   * The project root manifest.
   */
  mainManifest?: Manifest
  /**
   * A {@link Monorepo} object, for managing workspaces
   */
  monorepo?: Monorepo
  /**
   * A {@link PackageJson} object, for sharing manifest caches
   */
  packageJson: PackageJson
  /**
   * A {@link PathScurry} object, for use in globs
   */
  scurry: PathScurry
  /**
   * If set to `false`, `actual.load` will not load any `package.json`
   * files while traversing the file system.
   *
   * The resulting {@link Graph} from loading with `loadManifests=false`
   * has no information on dependency types or the specs defined and
   * no information on missing and extraneous dependencies.
   */
  loadManifests?: boolean
  /**
   * If set to `true`, then do not shortcut the process by reading the
   * hidden lockfile at `node_modules/.nrz-lock.json`
   */
  skipHiddenLockfile?: boolean
}

export type ReadEntry = {
  alias: string
  name: string
  realpath: Path
}

// path-based refer to the types of dependencies that are directly linked to
// their real location in the file system and thus will not have an entry
// in the `node_modules/.nrz` store
const pathBasedType = new Set(['file', 'workspace'])
const isPathBasedType = (
  type: string,
): type is 'file' | 'workspace' => pathBasedType.has(type)

/**
 * Returns a {@link DepID} for a given spec and path, if the spec is
 * path-based or a registry spec, otherwise returns `undefined`.
 */
export const getPathBasedId = (
  spec: Spec,
  path: Path,
): DepID | undefined =>
  isPathBasedType(spec.type) ?
    joinDepIDTuple([spec.type, path.relativePosix()])
  : findDepID(path)

/**
 * Retrieve the {@link DepID} for a given package from its location.
 */
const findDepID = ({ parent, name }: Path): DepID | undefined =>
  parent?.name === '.nrz' ? asDepID(name)
  : parent?.isCWD === false ? findDepID(parent)
  : undefined

/**
 * Retrieves the closest `node_modules` parent {@link Path} found.
 */
const findNodeModules = ({
  parent,
  name,
  isCWD,
}: Path): Path | undefined =>
  parent?.name === 'node_modules' ? parent
  : parent && name !== '.nrz' && !isCWD ? findNodeModules(parent)
  : undefined

/**
 * Retrieves the scoped-normalized package name from its {@link Path}.
 */
const findName = ({ parent, name }: Path): string =>
  parent?.name.startsWith('@') ? `${parent.name}/${name}` : name

const isStringArray = (a: unknown): a is string[] =>
  Array.isArray(a) && !a.some(b => typeof b !== 'string')

/*
 * Retrieves a map of all dependencies, of all types, that can be iterated
 * on and consulted when parsing the directory contents of the current node.
 */
const getDeps = (node: Node) => {
  const dependencies = new Map<string, RawDependency>()
  const bundleDeps: unknown = node.manifest?.bundleDependencies ?? []
  // if it's an importer, bundleDeps are just normal. if it's a dep,
  // then they're ignored entirely.
  const bundled =
    (
      !node.importer &&
      !node.id.startsWith('git') &&
      isStringArray(bundleDeps)
    ) ?
      new Set(bundleDeps)
    : new Set<string>()
  for (const depType of longDependencyTypes) {
    const obj: Record<string, string> | undefined =
      node.manifest?.[depType]
    // only care about devDeps for importers and git or symlink deps
    // technically this will also include devDeps for tarball file: specs,
    // but that is likely rare enough to not worry about too much.
    if (
      depType === 'devDependencies' &&
      !node.importer &&
      !node.id.startsWith('git') &&
      !node.id.startsWith('file')
    ) {
      continue
    }
    if (obj) {
      for (const [name, bareSpec] of Object.entries(obj)) {
        // if it's a bundled dependency, we just ignore it entirely.
        if (bundled.has(name)) continue
        dependencies.set(name, {
          name,
          type: depType,
          bareSpec,
          registry: node.registry,
        })
      }
    }
  }
  return dependencies
}

/**
 * Reads the current directory defined at `currDir` and looks for folder
 * names and their realpath resolution, normalizing scoped package names
 * and removing any invalid symlinks from the list of items that should
 * be parsed through in order to build the graph.
 */
const readDir = (
  scurry: PathScurry,
  currDir: Path,
  fromNodeName?: string,
) => {
  const res = new Set<ReadEntry>()
  for (const entry of scurry.readdirSync(currDir)) {
    // ignore any hidden files / folders
    if (entry.name.startsWith('.')) continue

    // scope folder found, it will need to be read and iterated over
    // in order to find any scoped packages inside
    if (entry.name.startsWith('@')) {
      const scopedItems = readDir(scurry, entry, fromNodeName)
      for (const scopedItem of scopedItems) {
        res.add(scopedItem)
      }
      continue
    }

    // skip anything that isn't a symlink, it's not an edge
    if (!entry.isSymbolicLink()) continue

    // we'll need to learn what is the real path for this entry in order
    // to retrieve the `location` and `id` properties for the node, if a
    // realpath is not found just move on to the next element
    const realpath = entry.realpathSync()
    if (!realpath) {
      continue
    }

    // infer both the alias and proper package names, including scopes
    const alias = findName(entry)
    const name = findName(realpath)
    res.add({
      alias,
      name,
      realpath,
    })
  }
  return res
}

/**
 * Parses the files located at `currDir` and place packages found inside
 * as dependencies of `fromNode`, building the instantiated `graph`.
 */
const parseDir = (
  options: LoadOptions,
  scurry: PathScurry,
  packageJson: PackageJson,
  depsFound: Map<Node, Path>,
  graph: Graph,
  fromNode: Node,
  currDir: Path,
) => {
  const { loadManifests } = options
  const dependencies = getDeps(fromNode)
  const seenDeps = new Set<string>()
  const readItems: Set<ReadEntry> = readDir(
    scurry,
    currDir,
    fromNode.name,
  )

  for (const { alias, name, realpath } of readItems) {
    let node

    // tracks what dependencies have been seen
    // so that we can mark missing dependencies
    seenDeps.add(alias)

    // places the package in the graph reading
    // its manifest only if necessary
    if (!loadManifests) {
      const depId = findDepID(realpath)

      if (depId) {
        const h = hydrate(depId, alias, {
          ...options,
          registry: fromNode.registry,
        })

        // graphs build with no manifest have no notion of
        // dependency types and or spec definitions since those
        // would have to be parsed from a manifest
        node = graph.placePackage(
          fromNode,
          'prod', // defaults to prod deps
          h, // uses spec from hydrated id
          {
            name,
            ...(h.registrySpec ?
              { version: h.registrySpec } // adds version if available
            : null),
          },
          depId,
        )
      }
    }

    // retrieve references to the current folder name found in `fromNode`
    // manifest listed dependencies, removing it from the map will leave
    // a list of missing dependencies at the end of the iteration
    const deps = dependencies.get(alias)

    // in case this graph is skipping manifests, this next block might
    // still need to execute, thus actually loading a manifest file, for
    // edge-cases such as loading a linked node that is not going to have
    // DepID info available in its realpath or extraneous nodes
    if (!node) {
      const mani = packageJson.read(realpath.fullpath())
      // declares fallback default values for both depType and bareSpec
      // in order to support loadManifests=false fallback for link nodes
      const type = deps?.type || 'dependencies'
      const bareSpec = deps?.bareSpec || '*'

      const depType = shorten(type, alias, fromNode.manifest)
      const spec = Spec.parse(alias, bareSpec, {
        ...options,
        registry: fromNode.registry,
      })
      const maybeId = getPathBasedId(spec, realpath)
      // retrieves the extra information from the depID if one is available
      let extra
      if (maybeId) {
        const [type, , maybeExtra, lastExtra] = splitDepID(maybeId)
        extra =
          type === 'registry' || type === 'git' ?
            lastExtra
          : maybeExtra
      }
      node = graph.placePackage(
        fromNode,
        depType,
        spec,
        mani,
        maybeId,
        extra,
      )
    }

    if (node) {
      // If a found dependency is not declared in any of the original
      // node dependencies, then add an edge to the graph pointing to it
      // and mark it as extraneous.
      //
      // This only makes sense if full manifests are being loaded
      // so that we have reference to dependencies info.
      if (loadManifests && !deps) {
        const [edge] = node.edgesIn
        if (edge) {
          graph.extraneousDependencies.add(edge)
        }
      }

      // for a succesfully created node, add its location
      // property and queue up to read its dependencies
      node.location = `./${realpath.relativePosix()}`
      const node_modules = findNodeModules(realpath)

      // queue items up to continue parsing dirs in case a node was succesfully
      // placed in the graph and its node_modules folder was correctly found
      if (node_modules) {
        depsFound.set(node, node_modules)
      }
    }
  }

  // any remaining dependencies that have not been found
  // when reading the directory should be marked as missing
  for (const { name, type, bareSpec } of dependencies.values()) {
    if (!seenDeps.has(name)) {
      const depType = shorten(type, name, fromNode.manifest)
      const spec = Spec.parse(name, bareSpec, {
        ...options,
        registry: fromNode.registry,
      })
      graph.placePackage(fromNode, depType, spec)
    }
  }
}

/**
 * Read the file system looking for `node_modules` folders and
 * returns a new {@link Graph} that represents the relationship
 * between the dependencies found.
 */
export const load = (options: LoadOptions): Graph => {
  const done = graphStep('actual')
  // TODO: once hidden lockfile is more reliable, default to false here
  const {
    skipHiddenLockfile = true,
    projectRoot,
    packageJson,
    scurry,
    monorepo,
  } = options
  const mainManifest =
    options.mainManifest ?? packageJson.read(projectRoot)

  if (!skipHiddenLockfile) {
    try {
      const graph = loadHidden({
        projectRoot,
        mainManifest,
        packageJson,
        monorepo,
        scurry,
      })
      // TODO: check mtime of lockfile vs .nrz folder
      return graph
    } catch {}
  }

  const graph = new Graph({ ...options, mainManifest })
  const depsFound = new Map<Node, Path>()

  // starts the list of initial folders to parse using the importer nodes
  for (const importer of graph.importers) {
    depsFound.set(
      importer,
      scurry.cwd.resolve(`${importer.location}/node_modules`),
    )
  }

  // breadth-first traversal of the file system tree reading deps found
  // starting from the node_modules folder of every importer in order to
  // find the actual installed dependencies at each location
  for (const [node, path] of depsFound.entries()) {
    parseDir(
      options,
      scurry,
      packageJson,
      depsFound,
      graph,
      node,
      path,
    )
  }

  done()

  return graph
}
