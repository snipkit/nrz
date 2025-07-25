import { Cache } from '@nrz/cache'
import { spawnSync } from 'node:child_process'
import t from 'tap'
import { gzipSync } from 'node:zlib'
import { __CODE_SPLIT_SCRIPT_NAME } from '../src/unzip.ts'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import type { Integrity } from '@nrz/types'

const ENV = {
  NODE_OPTIONS: '--no-warnings --experimental-strip-types',
}

t.test('validate args', async t => {
  t.match(
    spawnSync(process.execPath, [__CODE_SPLIT_SCRIPT_NAME], {
      input: '',
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf8',
      env: ENV,
    }),
    {
      status: 1,
    },
  )
  t.match(
    spawnSync(process.execPath, [__CODE_SPLIT_SCRIPT_NAME, 'path'], {
      input: '',
      env: ENV,
    }),
    {
      status: 1,
    },
  )
  t.match(
    spawnSync(
      process.execPath,
      [__CODE_SPLIT_SCRIPT_NAME, t.testdir()],
      {
        input: 'nope\0not valid\0no valid keys\0',
        env: ENV,
      },
    ),
    { status: 1 },
  )
})

t.test('unzip some stuff in the cache', async t => {
  const cache = new Cache({ path: t.testdir() })

  const head10 = Buffer.alloc(10)
  head10.writeUint32BE(10, 0)

  const plain = Buffer.concat([head10, Buffer.from('not gzipped')])
  const gzip = Buffer.concat([
    head10,
    gzipSync(Buffer.from('yes gzipped')),
  ])

  cache.set('gz1', gzip)
  cache.set('gz2', gzip)
  cache.set('plain1', plain)
  cache.set('plain2', plain)

  await cache.promise()

  // gutcheck, make sure it got written to cache
  const g = new Cache({ path: t.testdirName })
  t.strictSame(
    await g.fetch('gz1'),
    Buffer.concat([head10, gzipSync(Buffer.from('yes gzipped'))]),
  )
  t.strictSame(
    await g.fetch('gz2'),
    Buffer.concat([head10, gzipSync(Buffer.from('yes gzipped'))]),
  )
  t.strictSame(
    await g.fetch('plain1'),
    Buffer.concat([head10, Buffer.from('not gzipped')]),
  )
  t.strictSame(
    await g.fetch('plain2'),
    Buffer.concat([head10, Buffer.from('not gzipped')]),
  )

  const res = spawnSync(
    process.execPath,
    [__CODE_SPLIT_SCRIPT_NAME, t.testdirName],
    {
      input: 'gz1\0gz2\0plain1\0bogus\0',
      stdio: ['pipe', 'inherit', 'inherit'],
      env: ENV,
    },
  )
  t.matchOnlyStrict(res, {
    status: 0,
    signal: null,
    output: [null, null, null],
    pid: Number,
    stdout: null,
    stderr: null,
  })

  const c = new Cache({ path: t.testdirName })
  const resultHead = Buffer.concat([
    Buffer.from([0, 0, 0, 63]),
    Buffer.from([0, 0, 0]),
    Buffer.from([0, 0, 0, 'content-encoding'.length + 4]),
    Buffer.from('content-encoding'),
    Buffer.from([0, 0, 0, 'identity'.length + 4]),
    Buffer.from('identity'),
    Buffer.from([0, 0, 0, 'content-length'.length + 4]),
    Buffer.from('content-length'),
    Buffer.from([0, 0, 0, String('yes gzipped'.length).length + 4]),
    Buffer.from(String('yes gzipped'.length)),
  ])
  t.same(
    await c.fetch('gz1'),
    Buffer.concat([resultHead, Buffer.from('yes gzipped')]),
  )
  t.same(
    await c.fetch('gz2'),
    Buffer.concat([resultHead, Buffer.from('yes gzipped')]),
  )
  t.same(
    await c.fetch('plain1'),
    Buffer.concat([head10, Buffer.from('not gzipped')]),
  )
  t.same(
    await c.fetch('plain2'),
    Buffer.concat([head10, Buffer.from('not gzipped')]),
  )
})

t.test('unzip an entry that had headers', async t => {
  const unz = '{"hello":"world"}'
  const z = gzipSync(unz)
  const zheaders = Buffer.concat([
    Buffer.from([0, 0, 0, 'even'.length + 4]),
    Buffer.from('even'),
    Buffer.from([0, 0, 0, 'odd'.length + 4]),
    Buffer.from('odd'),
    Buffer.from([0, 0, 0, 'content-encoding'.length + 4]),
    Buffer.from('content-encoding'),
    Buffer.from([0, 0, 0, 'gzip'.length + 4]),
    Buffer.from('gzip'),
    Buffer.from([0, 0, 0, 'content-length'.length + 4]),
    Buffer.from('content-length'),
    Buffer.from([0, 0, 0, String(z.byteLength).length + 4]),
    Buffer.from(String(z.byteLength)),
  ])
  const zlen = zheaders.byteLength + 7
  const zipped = Buffer.concat(
    [Buffer.from([0, 0, 0, zlen]), Buffer.from('200'), zheaders, z],
    zlen + z.byteLength,
  )

  const resultHead = Buffer.concat([
    Buffer.from([0, 0, 0, 'even'.length + 4]),
    Buffer.from('even'),
    Buffer.from([0, 0, 0, 'odd'.length + 4]),
    Buffer.from('odd'),
    Buffer.from([0, 0, 0, 'content-encoding'.length + 4]),
    Buffer.from('content-encoding'),
    Buffer.from([0, 0, 0, 'identity'.length + 4]),
    Buffer.from('identity'),
    Buffer.from([0, 0, 0, 'content-length'.length + 4]),
    Buffer.from('content-length'),
    Buffer.from([0, 0, 0, String(unz.length).length + 4]),
    Buffer.from(String(unz.length)),
  ])
  const rlen = resultHead.byteLength + 7
  const result = Buffer.concat(
    [
      Buffer.from([0, 0, 0, rlen]),
      Buffer.from('200'),
      resultHead,
      Buffer.from(unz),
    ],
    rlen + unz.length,
  )

  const cache = new Cache({ path: t.testdir() })
  cache.set('gz1', zipped)
  await cache.promise()
  const res = spawnSync(
    process.execPath,
    [__CODE_SPLIT_SCRIPT_NAME, t.testdirName],
    {
      stdio: ['pipe', 'inherit', 'inherit'],
      input: 'gz1\0',
      env: ENV,
    },
  )
  t.matchOnlyStrict(res, {
    status: 0,
    signal: null,
    output: [null, null, null],
    pid: Number,
    stdout: null,
    stderr: null,
  })
  const c = new Cache({ path: t.testdirName })
  t.same(await c.fetch('gz1'), result)
})

t.test('unzip an entry with integrity', async t => {
  const integrity: Integrity = `sha512-${createHash('sha512').update('just a random integrity value').digest('base64')}`
  const unz = '{"hello":"world"}'
  const z = gzipSync(unz)
  const zheaders = Buffer.concat([
    Buffer.from([0, 0, 0, 'integrity'.length + 4]),
    Buffer.from('integrity'),
    Buffer.from([0, 0, 0, integrity.length + 4]),
    Buffer.from(integrity),
    Buffer.from([0, 0, 0, 'content-encoding'.length + 4]),
    Buffer.from('content-encoding'),
    Buffer.from([0, 0, 0, 'identity'.length + 4]),
    Buffer.from('identity'),
    Buffer.from([0, 0, 0, 'content-length'.length + 4]),
    Buffer.from('content-length'),
    Buffer.from([0, 0, 0, String(z.byteLength).length + 4]),
    Buffer.from(String(z.byteLength)),
  ])
  const zlen = zheaders.byteLength + 7
  const zipped = Buffer.concat(
    [Buffer.from([0, 0, 0, zlen]), Buffer.from('200'), zheaders, z],
    zlen + z.byteLength,
  )

  const resultHead = Buffer.concat([
    Buffer.from([0, 0, 0, 'integrity'.length + 4]),
    Buffer.from('integrity'),
    Buffer.from([0, 0, 0, integrity.length + 4]),
    Buffer.from(integrity),
    Buffer.from([0, 0, 0, 'content-encoding'.length + 4]),
    Buffer.from('content-encoding'),
    Buffer.from([0, 0, 0, 'identity'.length + 4]),
    Buffer.from('identity'),
    Buffer.from([0, 0, 0, 'content-length'.length + 4]),
    Buffer.from('content-length'),
    Buffer.from([0, 0, 0, String(unz.length).length + 4]),
    Buffer.from(String(unz.length)),
  ])
  const rlen = resultHead.byteLength + 7
  const result = Buffer.concat(
    [
      Buffer.from([0, 0, 0, rlen]),
      Buffer.from('200'),
      resultHead,
      Buffer.from(unz),
    ],
    rlen + unz.length,
  )

  const cache = new Cache({ path: t.testdir() })
  cache.set('gz1', zipped, { integrity })
  await cache.promise()
  const res = spawnSync(
    process.execPath,
    [__CODE_SPLIT_SCRIPT_NAME, t.testdirName],
    {
      stdio: ['pipe', 'inherit', 'inherit'],
      input: 'gz1\0',
      env: ENV,
    },
  )
  t.matchOnlyStrict(res, {
    status: 0,
    signal: null,
    output: [null, null, null],
    pid: Number,
    stdout: null,
    stderr: null,
  })
  const c = new Cache({ path: t.testdirName })
  t.same(await c.fetch('gz1'), result)
  const cacheFile = c.path('gz1')
  const integrityFile = c.integrityPath(integrity)!
  t.strictSame(
    await readFile(cacheFile, 'utf-8'),
    await readFile(integrityFile, 'utf-8'),
    'cache file and integrity are the same',
  )
  const cacheStat = await stat(cacheFile)
  const integrityStat = await stat(integrityFile)
  t.equal(
    cacheStat.dev,
    integrityStat.dev,
    'cache and integrity have same dev',
  )
  t.equal(
    cacheStat.ino,
    integrityStat.ino,
    'cache and integrity have same ino',
  )
  t.equal(
    cacheStat.nlink,
    integrityStat.nlink,
    'cache and integrity have same nlink',
  )
  t.equal(cacheStat.nlink, 2, 'nlink is 2')
})
