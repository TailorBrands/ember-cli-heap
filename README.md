ember-cli-heap
==============================================================================

[![Ember Observer Score](https://emberobserver.com/badges/ember-cli-heap.svg)](https://emberobserver.com/addons/ember-cli-heap)

This ember-cli addon injects heap analytics into index.html. More info on heap at https://heapanalytics.com

Since v5 this injects the **Heap v5 web SDK** loader
([docs](https://developers.heap.io/docs/web)).


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v22 or above


Upgrading from 4.x
------------------------------------------------------------------------------

Configuration is unchanged — `ENV.heap.projectId` is the v5 env id, and
`ENV.heap.development` still opts an environment out. What changes is the shape
of `window.heap`:

| 4.x (v4 SDK) | 5.x (v5 SDK) |
|---|---|
| `heap.userId` property | `heap.getUserId()` |
| `heap.identity` property | `heap.getIdentity()` |
| `heap.appid` | `heap.envId` |
| — | `heap.onReady(cb)` |
| `setEventProperties`, `unsetEventProperty` | removed by Heap |

**Readiness is now observable.** v5 loads in two hops: the injected
`heap_config.js` fetches the library itself, so that script's `load` event fires
*before* `getUserId()` can answer. Anything that needs Heap's anonymous id must
go through `heap.onReady`, which the queue stub records — so it fires regardless
of when you register it, and you never poll a getter.

Every method in `QUEUED_METHODS` (`lib/heap-snippet.js`) is shimmed by the stub,
so calls made before the library lands are replayed once it is ready.

Installation
------------------------------------------------------------------------------
`ember install ember-cli-heap`

Configuration
------------------------------------------------------------------------------

This plugin uses the ember-cli project's configuration as defined in `config/environment.js`.
```js
// environment.js
    ENV.heap = {
        projectId: 'xxxxxx'
    }
```

Add your heap projectId to `config/environment.js` and you're good to go.


You can disable injecting heap into different environments by setting the
development param to true:

```js
// environment.js

if (environment === 'test') {
  ENV.heap = {
    development: true
  }
}
```

## Disclaimer

This is completely unofficial and is not related to Heap Analytics in any way.

Contributing
------------------------------------------------------------------------------

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).

About Tailor Brands
------------------------------------------------------------------------------
[Check us out!](https://www.tailorbrands.com)
