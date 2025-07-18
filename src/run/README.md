![run](https://github.com/user-attachments/assets/7546e081-c35c-44ac-a4bc-05caf88b7a2b)

# @nrz/run

Run a script defined in a `package.json` file (eg, `nrz run` and
lifecycle scripts), or an arbitrary command as if it was (eg,
`nrz exec`).

## Usage

```js
import { run, exec } from '@nrz/run'

const cwd = '/path/to/pkg'

// to run a script, as with `nrz run blah`
const runResult = await run({
  // the name of the thing in package.json#scripts
  event: 'build',

  // the dir where the package.json lives
  cwd,

  // if the script is not defined in package.json#scripts, just
  // ignore it and treat as success. Otherwise, treat as an
  // error. Default false.
  ignoreMissing: true,

  // extra arguments to pass into the child process
  args: ['some', 'arguments'],

  // the environment variables to add, defaults to process.env.
  // note that @nrz/run will add some of its own, as well:
  // - npm_lifecycle_event: the event name
  // - npm_lifecycle_script: the command in package.json#scripts
  // - npm_package_json: path to the package.json file
  // - NRZ_* envs for all nrz configuration values that are set
  env: process.env,

  // set this to `true` to take over the terminal and run in the
  // foreground, inheriting the parent process's stdio
  // by default, the script runs in the background.
  // Only one foreground:true script will be run in parallel!
  foreground: true,

  // the shell to run the script in. Defaults to `${SHELL}` env
  // variable if set, otherwise the system specific shell,
  // `cmd.exe` on windows, and `/bin/sh` on posix.
  'script-shell': '/usr/bin/bash',

  // pass in a @nrz/package-json.PackageJson instance, and
  // it'll be used for reading the package.json file. Optional,
  // may improve performance somewhat.
  packageJson: new PackageJson(),
})

// to execute an arbitrary command, as with `nrz exec whatever`
const execResult = await exec({
  // the command to execute.
  command: 'do-something',
  args: ['some', 'arguments'],
  // other arguments all the same.
})
```
