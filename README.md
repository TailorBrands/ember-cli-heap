ember-cli-heap
==============================================================================

[![Ember Observer Score](https://emberobserver.com/badges/ember-cli-heap.svg)](https://emberobserver.com/addons/ember-cli-heap)

This ember-cli addon injects heap analytics into index.html. More info on heap at https://heapanalytics.com



Compatibility
------------------------------------------------------------------------------
* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v8 or above

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
