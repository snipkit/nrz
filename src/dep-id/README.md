![dep-id](https://github.com/user-attachments/assets/f44cb9f8-e778-447c-8100-9ff564427048)

# @nrz/dep-id

A library for serializing dependencies into terse string identifiers, and turning those serialized identifiers back into `Spec` objects.

**[Usage](#usage)**
·
**[Note](#note)**

## Usage

```js
import {
  getId,
  getTuple,
  hydrate,
  hydrateTuple,
  joinDepIDTuple,
  splitDepID,
} from '@nrz/dep-id'
import { manifest } from '@nrz/package-info'

{
  // default registry
  const spec = Spec.parse('x@latest')
  const mani = await manifest(spec)
  const id = getId(spec, mani) // registry;;x@1.2.3
}

{
  // not default registry
  const spec = Spec.parse('x@nrz:y@latest', {
    registries: { nrz: 'http://khulnasoft.com' },
  })
  const mani = await manifest(spec)
  const id = getId(spec, mani) // registry;nrz;y@latest
}

{
  // git, hosted
  const spec = Spec.parse('x@github:a/b#branch')
  const mani = await manifest(spec)
  const id = getId(spec, mani) // git;github:a/b;branch
}

// Hydrate by providing a name, and options for the spec creation
const spec = hydrate('git;github:a/b;branch', 'x') // x@github:a/b#branch
```

### Note

multiple different spec/manifest combinations _can_ result
in the same identifier. For example, the specifiers
`x@npm:y@latest` and `asdf@npm:y@1.x` might both ultimately
resolve to the same package, so they only need to appear in the
store once.

## BROWSER API

An isomorphic API `@nrz/dep-id/browser` is provided for use in the browser.
