![satisfies](https://github.com/user-attachments/assets/5dc35dbc-c8b2-4dac-844d-81ee5569347b)

# @nrz/satisfies

Give it a DepID and a Spec, and it'll tell you whether that dep
satisfies the spec.

## Usage

```js
import { Spec } from '@nrz/spec'
import { satisfies } from '@nrz/satisfies'

const id = ';;glob@11.0.1'
const spec = Spec.parse('foo@npm:glob@11.x')

console.log(satisfies(id, spec)) // true
```
