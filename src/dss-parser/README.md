# @nrz/dss-parser

The Dependency Selector Syntax parser used by the nrz client.

Uses
[postcss-selector-parser](https://github.com/postcss/postcss-selector-parser)
to parse a selector string into an AST.

## Usage

```js
import { parse } from '@nrz/dss-parser'

// Parse a selector string into an AST
const ast = parse(':root > *')
```
