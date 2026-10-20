import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'

test('indicator waits for slots, registers once and cleans up with its scope', () => {
  let plugin, onSlots, descriptor, component
  let mounted = 0, styles = 0
  const rootCleanup = [], slotCleanup = []
  const sandbox = {
    window: { __ModuleLoader__: { load: entry => { plugin = entry.factory(() => ({
      createElement: (...args) => args,
    })) } } },
    document: {
      createElement: () => ({ remove: () => styles-- }),
      head: { append: () => styles++ },
    },
  }
  vm.runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), sandbox)
  plugin.apply({
    effect: setup => rootCleanup.push(setup()),
    inject: (names, callback) => { assert.deepEqual(Array.from(names), ['slots']); onSlots = callback },
  })
  assert.equal(mounted, 0)
  assert.equal(styles, 1)
  const scope = {
    effect: setup => slotCleanup.push(setup()),
    slots: {
      inject: (name, callback) => { assert.equal(name, 'conversation.input.right'); return callback() },
      register: (meta, render) => { descriptor = meta; component = render; mounted++; return () => mounted-- },
    },
  }
  onSlots(scope)
  assert.equal(mounted, 1)
  assert.equal(descriptor.id, 'opencodego-usage')
  assert.equal(typeof component()[0], 'function')
  slotCleanup.reverse().forEach(cleanup => cleanup())
  rootCleanup.reverse().forEach(cleanup => cleanup())
  assert.equal(mounted, 0)
  assert.equal(styles, 0)
})
