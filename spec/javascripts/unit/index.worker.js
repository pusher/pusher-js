var sharedTestsContext = require.context("./core", true, /_spec$/);
sharedTestsContext.keys().forEach(sharedTestsContext);

var nodeTestsContext = require.context("./isomorphic", true, /_spec$/);
nodeTestsContext.keys().forEach(nodeTestsContext);

var nodeTestsContext = require.context("./worker", true, /_spec$/);
nodeTestsContext.keys().forEach(nodeTestsContext);

var coreWithRuntimeTestsContext = require.context("./core_with_runtime", true, /_spec$/);
coreWithRuntimeTestsContext.keys().forEach(coreWithRuntimeTestsContext)
