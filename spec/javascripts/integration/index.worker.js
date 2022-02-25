var sharedTestsContext = require.context("./core", true, /_spec$/);
var testConfigs = [{
  transport: "ws",
  forceTLS: true,
},{
  transport: "ws",
  forceTLS: false,
}];


sharedTestsContext.keys().forEach((key) => {
  sharedTestsContext(key)(testConfigs);
})
