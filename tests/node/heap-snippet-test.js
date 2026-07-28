'use strict';

const vm = require('vm');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const addon = require('../../index');
const { QUEUED_METHODS, heapSnippet } = require('../../lib/heap-snippet');

const ENV_ID = '3538007744';

// The methods consumers actually depend on. Deliberately a separate, explicit
// list from QUEUED_METHODS: a loop over the real array cannot catch a removal
// from it, so this asserts the contract by name.
const CONTRACT = [
  'onReady',
  'getUserId',
  'getSessionId',
  'getIdentity',
  'track',
  'identify',
  'resetIdentity',
  'addUserProperties',
  'addEventProperties',
  'removeEventProperty',
  'clearEventProperties',
];

// Runs the generated snippet against a minimal fake DOM so we assert real
// behaviour rather than substring matches.
function runSnippet(envId) {
  const inserted = [];
  const firstScript = {
    parentNode: {
      insertBefore(node) {
        inserted.push(node);
      },
    },
  };
  const sandbox = {
    window: {},
    document: {
      createElement: () => ({}),
      getElementsByTagName: () => [firstScript],
    },
  };

  const body = heapSnippet(envId)
    .replace(/^<script type="text\/javascript">/, '')
    .replace(/<\/script>$/, '');

  vm.createContext(sandbox);
  vm.runInContext(body, sandbox);

  return { heap: sandbox.window.heap, window: sandbox.window, inserted };
}

describe('contentFor', function () {
  const config = { heap: { projectId: ENV_ID } };

  it('injects the snippet into head when configured', function () {
    const output = addon.contentFor('head', config);

    assert.ok(output.startsWith('<script'), 'returns a script tag');
    assert.ok(output.includes(ENV_ID), 'carries the configured project id');
  });

  it('injects nothing for other contentFor types', function () {
    assert.strictEqual(addon.contentFor('body', config), undefined);
  });

  it('injects nothing without a heap config', function () {
    assert.strictEqual(addon.contentFor('head', {}), undefined);
  });

  it('injects nothing without a projectId', function () {
    assert.strictEqual(addon.contentFor('head', { heap: {} }), undefined);
  });

  it('injects nothing when the environment opts out', function () {
    const output = addon.contentFor('head', {
      heap: { projectId: ENV_ID, development: true },
    });

    assert.strictEqual(output, undefined);
  });
});

describe('snippet contents', function () {
  it('loads the v5 config bundle for the given env id', function () {
    const output = heapSnippet(ENV_ID);

    assert.ok(
      output.includes(
        'https://cdn.us.heap-api.com/config/"+envId+"/heap_config.js'
      ),
      'points at the v5 config host'
    );
  });

  it('does not reference the v4 CDN or appid', function () {
    const output = heapSnippet(ENV_ID);

    assert.ok(
      !output.includes('cdn.heapanalytics.com'),
      'no v4 CDN reference'
    );
    assert.ok(!output.includes('appid'), 'no v4 appid property');
  });
});

describe('snippet behaviour', function () {
  it('records the env id and suppresses the server config fetch', function () {
    const { heap } = runSnippet(ENV_ID);

    assert.strictEqual(heap.envId, ENV_ID, 'env id recorded');
    assert.strictEqual(
      heap.clientConfig.shouldFetchServerConfig,
      false,
      'config bundle ships with the loader, so no round-trip'
    );
  });

  it('injects the config script asynchronously', function () {
    const { inserted } = runSnippet(ENV_ID);

    assert.strictEqual(inserted.length, 1, 'exactly one script injected');
    assert.strictEqual(inserted[0].async, true, 'never blocks parsing');
    assert.strictEqual(
      inserted[0].src,
      `https://cdn.us.heap-api.com/config/${ENV_ID}/heap_config.js`
    );
  });

  it('shims every queued method', function () {
    const { heap } = runSnippet(ENV_ID);

    QUEUED_METHODS.forEach((name) => {
      assert.strictEqual(typeof heap[name], 'function', `${name} is shimmed`);
    });
  });

  CONTRACT.forEach((name) => {
    it(`shims ${name}, which consumers depend on`, function () {
      const { heap } = runSnippet(ENV_ID);

      assert.strictEqual(typeof heap[name], 'function');
    });
  });

  it('queues a call made before the library lands', function () {
    const { heap, window } = runSnippet(ENV_ID);

    heap.track('signed_up', { plan: 'pro' });

    assert.strictEqual(window.heapReadyCb.length, 1, 'one queued entry');
    assert.strictEqual(window.heapReadyCb[0].name, 'track');
  });

  it('replays a queued call against the real library with the original args', function () {
    const { heap, window } = runSnippet(ENV_ID);
    heap.track('signed_up', { plan: 'pro' });

    // What the real library does when it loads: replace the stub, drain the queue.
    const calls = [];
    window.heap.track = (...args) => calls.push(args);
    window.heapReadyCb.forEach((entry) => entry.fn());

    assert.deepStrictEqual(calls, [['signed_up', { plan: 'pro' }]]);
  });

  it('registers an onReady callback for replay rather than dropping it', function () {
    const { heap, window } = runSnippet(ENV_ID);
    const callback = () => {};

    heap.onReady(callback);

    const received = [];
    window.heap.onReady = (cb) => received.push(cb);
    window.heapReadyCb.forEach((entry) => entry.fn());

    assert.deepStrictEqual(received, [callback], 'the exact callback replayed');
  });

  it('re-queues instead of recursing when the library never defines the method', function () {
    // Inherited from Heap's official snippet: the replay closure resolves
    // window.heap[name] at call time, so draining while the stub is still in
    // place pushes a fresh entry rather than blowing the stack. Asserted so the
    // behaviour is documented rather than discovered.
    const { heap, window } = runSnippet(ENV_ID);
    heap.track('signed_up');

    const queued = window.heapReadyCb.splice(0, 1);
    queued[0].fn();

    assert.strictEqual(window.heapReadyCb.length, 1, 're-queued, not recursed');
    assert.strictEqual(window.heapReadyCb[0].name, 'track');
  });
});
