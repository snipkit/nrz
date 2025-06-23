# @nrz/init

Project initialization logic for `nrz`.

**[Usage](#usage)**

## Overview

This is a tool that provides the project initialization logic used by
the nrz cli and gui.

## Usage

```js
import { init } from '@nrz/init'

// initalize a project
const results = await init({ cwd: '/some/path' })

// now results contains { manifest: { path, data }}
```
