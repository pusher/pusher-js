SHELL := /bin/bash

build_all: web react-native node worker

# sockjs:
# 	pushd src/runtimes/web/dom/sockjs && \
# 	npm install &&  \
# 	make build &&  \
# 	popd

json2:
	cp src/runtimes/web/dom/json2.js dist/web
	node_modules/.bin/uglifyjs dist/web/json2.js -o dist/web/json2.min.js

web:
	echo "Browser Release:"
	# make sockjs
	# cp src/runtimes/web/dom/sockjs/sockjs.js dist/web
	node_modules/webpack/bin/webpack.js --config=webpack/config.web.js
	echo "Browser Minified Release:"
	# cp src/runtimes/web/dom/sockjs/sockjs.min.js dist/web
	MINIFY=web node_modules/webpack/bin/webpack.js --config=webpack/config.min.js

react-native:
	echo "React Native Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.react-native.js

node:
	echo "NodeJS Release":
	node_modules/webpack/bin/webpack.js --config=webpack/config.node.js

worker:
	echo "Web Worker Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js
	echo "Web Worker Minified Release:"
	MINIFY=worker node_modules/webpack/bin/webpack.js --config=webpack/config.min.js

web_unit:
	node_modules/karma/bin/karma start spec/config/karma/unit.js

web_integration:
	node_modules/karma/bin/karma start spec/config/karma/integration.js

worker_unit:
	WORKER=true node_modules/karma/bin/karma start spec/config/karma/unit.js

worker_integration:
	WORKER=true node_modules/karma/bin/karma start spec/config/karma/integration.js

node_unit:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine-node/webpack.unit.js && \
	node spec/config/jasmine-node/config.js ./tmp/node_unit

node_integration:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine-node/webpack.integration.js && \
	node spec/config/jasmine-node/config.js ./tmp/node_integration

serve:
	node webpack/dev.server.js

.PHONY: build_all
