var testsContext = require.context(".", true, /pusher_spec$/);
testsContext.keys().forEach(testsContext);
