![build](https://github.com/user-attachments/assets/4ceaa394-8707-4bb3-935a-b29cd2c397ee)

# @nrz/infra-build

> An internal only workspace that is not published to any registry.

Utilized for building nrz.

## Usage

**Bundle and Compile**

```ts
import { bundle, compile } from '@nrz/infra-build'

const whichBinsToBundle = ['nrz'] as const
const bundleResult = await bundle({ outdir: './bundle', bins })

if (youWantToCompileAlso) {
  compileResult = await compile({
    source: bundleResult.outdir,
    outdir: './compile',
    bins,
  })
}
```

**Compile Only**

```ts
import { compile } from '@nrz/infra-build'

// This will also bundle to a temp dir and compile from that
const result = await compile({ outdir: './compile', bins })
```

**CLI**

```bash
nrz-build --outdir=bundle --bins=nrz bundle
nrz-build --outdir=compile --bins=nrz compile
```
