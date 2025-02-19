![package-json](https://github.com/user-attachments/assets/b91bae89-456d-4841-853a-e3655aa34ac4)

# @nrz/package-json

Manages reading `package.json` files.

Caches previously seen files and augments error messages for clarity.

## Usage

```js
import { PackageJson } from '@nrz/package-json'

const packageJson = new PackageJson()
const dir = process.cwd()
const pkg = await packageJson.read(dir)
```
