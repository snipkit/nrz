![nrz](https://github.com/user-attachments/assets/345949ff-7150-4b97-856d-c7e42c2a4db5)

# @nrz/cli-sdk

The SDK for the `nrz` command line interface.

## Usage

```ts
import nrz from '@nrz/cli-sdk'
process.argv.splice(2, 0, '--version')
await nrz()
```

```ts
import nrz from '@nrz/cli-sdk'
process.chdir('/some/nrz/project')
process.argv.splice(2, 0, 'install')
await nrz()
```

Visit [docs.nrz.sh](https://docs.nrz.sh) to see the full
documentation.
