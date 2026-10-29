SHELL := /bin/bash

.PHONY: build_all
build_all: types web cjs react-native node worker

# webpack only transpiles TypeScript, so type-checking and the declarations in
# types/ come from tsc. This one target does both, and the build and unit test
# targets depend on it, so a type error fails them. types/ is cleared first so
# declarations for deleted or renamed files aren't published. The second tsc
# run checks the published entry declarations against the generated types/.
.PHONY: types
types:
	rm -rf types
	node_modules/.bin/tsc -p . --emitDeclarationOnly
	node_modules/.bin/tsc -p tsconfig.declarations.json

.PHONY: json2
json2:
	cp src/runtimes/web/dom/json2.js dist/web
	node_modules/.bin/uglifyjs dist/web/json2.js -o dist/web/json2.min.js

.PHONY: web
web: types
	@echo "Browser Release:"
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

	@echo "Browser Release (with encryption)"
	INCLUDE_TWEETNACL=true MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

	@echo "Minified Browser Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

	@echo "Minified Browser Release (with encryption)"
	INCLUDE_TWEETNACL=true node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

.PHONY: cjs
cjs: types
	@echo "CommonJS Release:"
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.cjs.js

	@echo "CommonJS Release (with encryption)"
	INCLUDE_TWEETNACL=true MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.cjs.js

.PHONY: cjs_unit
cjs_unit: cjs
	node_modules/.bin/jasmine --config=spec/config/jasmine/cjs.json

.PHONY: react-native
react-native: types
	@echo "React Native Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.react-native.js

.PHONY: node
node: types
	@echo "NodeJS Release":
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.node.js

.PHONY: worker
worker: types
	@echo "Web Worker Release"
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

	@echo "Web Worker Release (with encryption)"
	INCLUDE_TWEETNACL=true MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

	@echo "Minified Web Worker Release"
	node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

	@echo "Minified Web Worker Release (with encryption)"
	INCLUDE_TWEETNACL=true node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

.PHONY: web_unit
web_unit: types
	node_modules/karma/bin/karma start spec/config/karma/unit.js

.PHONY: web_integration
web_integration:
	node_modules/karma/bin/karma start spec/config/karma/integration.js

.PHONY: worker_unit
worker_unit: types
	WORKER=true node_modules/karma/bin/karma start spec/config/karma/unit.js

.PHONY: worker_integration
worker_integration:
	WORKER=true node_modules/karma/bin/karma start spec/config/karma/integration.js

.PHONY: node_unit
node_unit: types
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine/webpack.unit.js && \
	node_modules/.bin/jasmine --config=spec/config/jasmine/unit.json

.PHONY: node_integration
node_integration:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine/webpack.integration.js && \
	node_modules/.bin/jasmine --config=spec/config/jasmine/integration.json

.PHONY: node_bundle_unit
node_bundle_unit: node
	node_modules/.bin/jasmine --config=spec/config/jasmine/node_bundle.json

.PHONY: react_native_bundle_unit
react_native_bundle_unit: react-native
	node_modules/.bin/jasmine --config=spec/config/jasmine/react_native_bundle.json


.PHONY: serve
serve:
	node webpack/dev.server.js
