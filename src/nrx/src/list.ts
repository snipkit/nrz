import { XDG } from '@nrz/xdg'
import { opendir } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function* nrxList() {
  const path = new XDG('nrz/nrx').data()
  const dir = await opendir(path)
  for await (const dirent of dir) {
    yield resolve(path, dirent.name)
  }
}
