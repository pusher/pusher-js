# core with runtime

This directory contains unit tests for core features that requires access to a `Runtime`. These tests will be included in the unit tests for each runtime and the proper runtime will be loaded before calling those tests.

In order for this to work, this directory `core_with_runtime` need to be included in `unit/index.node.js` and similar files after the proper runtime directory is included (ex. `unit/node`)
