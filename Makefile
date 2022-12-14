SHELL := /bin/bash

.PHONY: build_all
build_all: web react-native node worker

.PHONY: json2
json2:
	cp src/runtimes/web/dom/json2.js dist/web
	node_modules/.bin/uglifyjs dist/web/json2.js -o dist/web/json2.min.js

.PHONY: web
web:
	@echo "Browser Release:"
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

	@echo "Browser Release (with encryption)"
	INCLUDE_TWEETNACL=true MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

	@echo "Minified Browser Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

	@echo "Minified Browser Release (with encryption)"
	INCLUDE_TWEETNACL=true node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

.PHONY: react-native
react-native:
	@echo "React Native Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.react-native.js

.PHONY: node
node:
	@echo "NodeJS Release":
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.node.js

.PHONY: worker
worker:
	@echo "Web Worker Release"
	MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

	@echo "Web Worker Release (with encryption)"
	INCLUDE_TWEETNACL=true MINIMIZE=false node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

	@echo "Minified Web Worker Release"
	node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

	@echo "Minified Web Worker Release (with encryption)"
	INCLUDE_TWEETNACL=true node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

.PHONY: web_unit
web_unit:
	node_modules/karma/bin/karma start spec/config/karma/unit.js

.PHONY: web_integration
web_integration:
	node_modules/karma/bin/karma start spec/config/karma/integration.js

.PHONY: worker_unit
worker_unit:
	WORKER=true node_modules/karma/bin/karma start spec/config/karma/unit.js

.PHONY: worker_integration
worker_integration:
	WORKER=true node_modules/karma/bin/karma start spec/config/karma/integration.js

.PHONY: node_unit
node_unit:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine/webpack.unit.js && \
	node_modules/.bin/jasmine --config=spec/config/jasmine/unit.json

.PHONY: node_integration
node_integration:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine/webpack.integration.js && \
	node_modules/.bin/jasmine --config=spec/config/jasmine/integration.json


.PHONY: serve
serve:
	node webpack/dev.server.js
