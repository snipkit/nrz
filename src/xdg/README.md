![xdg](https://github.com/user-attachments/assets/72b3e499-40c0-4f2a-8cd7-7761303bda62)

# @nrz/xdg

Get appropriate data, cache, and config directories following the [XDG spec](https://wiki.archlinux.org/title/XDG_Base_Directory), namespaced to a specific app-name subfolder.

## Usage

```js
import XDG from '@nrz/xdg'

// instantiate with the name of your thing.
const xdg = new XDG('nrz')

const cachePath = xdg.cache('some-path') // ~/.cache/nrz/some-path
const configFile = xdg.config('nrz.json') // ~/.config/nrz/nrz.json
const dataFolder = xdg.data('blah') // ~/.local/share/nrz/blah
const someState = xdg.state('foobar') // ~/.local/state/nrz/fooobar
```
