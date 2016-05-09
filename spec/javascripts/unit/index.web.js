// the webpack context API uses Object.keys and Array.prototype.forEach
// both of which are unavailable in old versions of IE.
require('../polyfills');

var sharedTestsContext = require.context("./core", true, /_spec$/);
sharedTestsContext.keys().forEach(sharedTestsContext);

var nodeTestsContext = require.context("./web", true, /_spec$/);
nodeTestsContext.keys().forEach(nodeTestsContext);
