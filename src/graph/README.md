![graph](https://github.com/user-attachments/assets/dfbed9e0-8ef0-4a43-993d-d3e5d1e5ae1d)

# @nrz/graph

This is the graph library responsible for representing the packages
that are involved in a given install.

**[API](#api)** · **[Usage](#usage)**

## API

### `actual.load({ projectRoot: string }): Graph`

Recursively loads the `node_modules` folder found at `projectRoot` in
order to create a graph representation of the current installed
packages.

### `async ideal.build({ projectRoot: string }): Promise<Graph>`

This method returns a new `Graph` object, reading from the
`package.json` file located at `projectRoot` dir and building up the
graph representation of nodes and edges from the files read from the
local file system.

### `lockfile.load({ mainManifest: Manifest, projectRoot: string }): Graph`

Loads the lockfile file found at `projectRoot` and returns the graph.

## Usage

Here's a quick example of how to use the `@nrz/graph.ideal.build`
method to build a graph representation of the install defined at the
`projectRoot` directory.

```
import { ideal } from '@nrz/graph'

const graph = await ideal.build({ projectRoot: process.cwd() })
```
