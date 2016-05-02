var sharedTestsContext = require.context("./core", true, /_spec$/);
sharedTestsContext.keys().forEach(sharedTestsContext);
