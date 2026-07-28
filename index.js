'use strict';

const { heapSnippet } = require('./lib/heap-snippet');

module.exports = {
  name: require('./package').name,

  contentFor: function (type, config) {
    if (
      type === 'head' &&
      config.heap &&
      !config.heap.development &&
      config.heap.projectId
    ) {
      return heapSnippet(config.heap.projectId);
    }
  },
};
