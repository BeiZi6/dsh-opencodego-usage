import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { test } from 'node:test'
import { apply } from '../index.js'

test('quota route resolves credentials and returns three windows; disposal removes route', async t => {
  const cleanup = []
  let route, credentialRef
  t.mock.method(childProcess, 'execFile', (command, args, options, callback) => {
    assert.ok(args.includes('Authorization: Bearer test-only-secret'))
    callback(null, JSON.stringify({ usage: {
      rolling: { percent: 25, resetsAt: '2026-10-21T00:00:00Z' },
      weekly: { percent: '50' }, monthly: { percent: 75 },
    } }) + '\n@@OCG_STATUS@@200', '')
  })
  syncBuiltinESMExports()
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports() })
  const services = {
    agentDefaultModel: { currentSelection: () => ({ provider: 'opencode-go' }) },
    settings: { get: () => ({ providers: { 'opencode-go': { apiKeyEnv: 'TEST_OCG_KEY' } } }) },
    credentials: { resolve: async ref => { credentialRef = ref; return { value: 'test-only-secret' } } },
  }
  apply({
    get: name => services[name],
    inject: (names, callback) => {
      assert.deepEqual(names, ['webServer'])
      callback({ effect: setup => cleanup.push(setup()), webServer: {
        register: value => { route = value; return () => { route = undefined } },
      } })
    },
  })
  let status, payload
  const response = { writeHead: code => { status = code }, end: text => { payload = JSON.parse(text) } }
  await route.handler({ url: '/opencodego-usage' }, response)
  assert.equal(status, 200)
  assert.equal(credentialRef, 'TEST_OCG_KEY')
  assert.equal(payload.ok, true)
  assert.deepEqual(payload.windows.map(window => window.percent), [25, 50, 75])
  assert.deepEqual(payload.windows.map(window => window.label), ['近5小时', '近7天', '近30天'])
  cleanup.forEach(dispose => dispose())
  assert.equal(route, undefined)
})
