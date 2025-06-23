import t from 'tap'

import { nrxDelete } from '../src/delete.ts'
import * as nrx from '../src/index.ts'
import { nrxInfo } from '../src/info.ts'
import { nrxInstall } from '../src/install.ts'
import { nrxList } from '../src/list.ts'
import { nrxResolve } from '../src/resolve.ts'

import type { PromptFn, VlxInfo, VlxOptions } from '../src/index.ts'

const typeChecks = () => {
  //@ts-expect-error
  const x: VlxOptions = undefined
  //@ts-expect-error
  const z: VlxInfo = undefined
  //@ts-expect-error
  const y: PromptFn = () => {}
  x
  y
  z
}
typeChecks

t.strictSame(
  nrx,
  Object.assign(Object.create(null), {
    info: nrxInfo,
    install: nrxInstall,
    resolve: nrxResolve,
    list: nrxList,
    delete: nrxDelete,
  }),
)
