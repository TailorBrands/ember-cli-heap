'use strict';

// Heap v5 web SDK loader, written out rather than pasted minified so the two
// behaviours consumers depend on are reviewable. Mirrors borg's loader
// (apps/host/src/monitoring/heap.ts) so both frontends behave identically.
//
// Two v5 differences matter to consumers:
//
//   1. The injected script is `heap_config.js`, which then loads the actual
//      library. Its `load` event is therefore NOT a readiness signal — anything
//      that needs Heap's anonymous id must go through `heap.onReady`, which the
//      stub queues, so registration order is irrelevant.
//   2. The anonymous id moved from the `heap.userId` property to `getUserId()`.
//      Only the real library can answer it; the stub shims it as a void queued
//      call that returns undefined. That asymmetry is why readiness is observed
//      through `onReady` and never by polling a getter.
//
// Exported so tests assert against the real list rather than a copy that can
// drift out of sync without failing anything.
const QUEUED_METHODS = [
  'init',
  'startTracking',
  'stopTracking',
  'track',
  'resetIdentity',
  'identify',
  'identifyHashed',
  'getSessionId',
  'getUserId',
  'getIdentity',
  'addUserProperties',
  'addEventProperties',
  'removeEventProperty',
  'clearEventProperties',
  'addAccountProperties',
  'addAdapter',
  'addTransformer',
  'addTransformerFn',
  'onReady',
  'addPageviewProperties',
  'removePageviewProperty',
  'clearPageviewProperties',
  'trackPageview',
];

// The generated body is inlined into index.html and runs before any
// transpilation, so it must stay ES5 — `var`, no arrows, no template literals.
function heapSnippet(envId) {
  return (
    '<script type="text/javascript">' +
    '(function(){' +
    'window.heapReadyCb=window.heapReadyCb||[];' +
    'window.heap=window.heap||[];' +
    'window.heap.load=function(envId,clientConfig){' +
    'window.heap.envId=envId;' +
    'window.heap.clientConfig=clientConfig||{};' +
    // The config bundle is served with the loader, so the client must not
    // round-trip for it before it can start tracking.
    'window.heap.clientConfig.shouldFetchServerConfig=false;' +
    'var s=document.createElement("script");' +
    's.type="text/javascript";' +
    's.async=true;' +
    's.src="https://cdn.us.heap-api.com/config/"+envId+"/heap_config.js";' +
    'var f=document.getElementsByTagName("script")[0];' +
    'f.parentNode.insertBefore(s,f);' +
    'var m=' +
    JSON.stringify(QUEUED_METHODS) +
    ';' +
    'var q=function(name){return function(){' +
    'var args=Array.prototype.slice.call(arguments,0);' +
    'window.heapReadyCb.push({name:name,fn:function(){' +
    // Resolved at replay time, when the real library has replaced the stub.
    'if(window.heap[name]){window.heap[name].apply(window.heap,args);}' +
    '}});' +
    '};};' +
    'for(var i=0;i<m.length;i++){window.heap[m[i]]=q(m[i]);}' +
    '};' +
    'window.heap.load(' +
    JSON.stringify(String(envId)) +
    ');' +
    '})();' +
    '</script>'
  );
}

module.exports = { QUEUED_METHODS, heapSnippet };
