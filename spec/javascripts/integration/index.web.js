var sharedTestsContext = require.context("./core", true, /_spec$/);
sharedTestsContext.keys().forEach(sharedTestsContext);

var webTestsContext = require.context("./web", true, /_spec$/);
webTestsContext.keys().forEach(webTestsContext);
