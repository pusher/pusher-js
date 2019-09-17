// the webpack context API uses Object.keys and Array.prototype.forEach
// both of which are unavailable in old versions of IE.
require('../polyfills');

// there are some circular dependencies and there are type errors when requiring
// runtime before core/pusher
require('core/pusher');

var Runtime = require('runtime').default;
var TestEnv = require('testenv');

var testConfigs = getTestConfigs();

// We can access this 'env var' here because there's a webpack.DefinePlugin
// overwriting this value with whatever is set at compile time
if (process.env.MINIMAL_INTEGRATION_TESTS) {
  testConfigs = testConfigs.filter((config) => config.forceTLS && config.transport === "ws")
}

var sharedTestsContext = require.context("./core", true, /_spec$/);
sharedTestsContext.keys().forEach((key) => {
  sharedTestsContext(key)(testConfigs);
});

var webTestsContext = require.context("./web", true, /_spec$/);
webTestsContext.keys().forEach(webTestsContext);

function getTestConfigs() {
  var testConfigs = [{
    transport: "ws",
    forceTLS: true,
  },{
    transport: "ws",
    forceTLS: false,
  }];

  if (Runtime.isXHRSupported()) {
    // CORS-compatible browsers
    if (TestEnv !== "web" || !/Android 2\./i.test(navigator.userAgent)) {
      testConfigs.push({ transport: "xhr_streaming", forceTLS: true})
      testConfigs.push({ transport: "xhr_streaming", forceTLS: false})
    }
    testConfigs.push({transport: "xhr_polling", forceTLS: true})
    testConfigs.push({transport: "xhr_polling", forceTLS: false})

  } else if (Runtime.isXDRSupported(false)) {

    testConfigs.push({transport: "xdr_streaming", forceTLS: true})
    testConfigs.push({transport: "xdr_streaming", forceTLS: false})
    testConfigs.push({transport: "xdr_polling", forceTLS: true})
    testConfigs.push({transport: "xdr_polling", forceTLS: false})

    // IE can fall back to SockJS if protocols don't match
    // No SockJS TLS tests due to the way JS files are served
    testConfigs.push({transport: "sockjs", forceTLS: false})

  } else {
    // Browsers using SockJS
    testConfigs.push({ transport: "sockjs", forceTLS: true})
    testConfigs.push({ transport: "sockjs", forceTLS: false})
  }
  return testConfigs
}
