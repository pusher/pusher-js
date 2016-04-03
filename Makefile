build_all: web web-min web-umd react-native node worker

web:
	echo "Browser Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.web.js

web-min:
	echo "Browser Minified Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.web.min.js

web-umd:
	echo "Web UMD Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.web-umd.js

react-native:
	echo "React Native Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.react-native.js

node:
	echo "NodeJS Release":
	node_modules/webpack/bin/webpack.js --config=webpack/config.node.js

worker:
	echo "Web Worker Release:"
	node_modules/webpack/bin/webpack.js --config=webpack/config.worker.js

web_unit:
	node_modules/karma/bin/karma start spec/config/karma/unit.js

web_integration:
	node_modules/karma/bin/karma start spec/config/karma/integration.js

node_unit:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine-node/unit.js && \
	node_modules/jasmine-node/bin/jasmine-node --captureExceptions --verbose tmp/node_unit

node_integration:
	node_modules/webpack/bin/webpack.js --config=spec/config/jasmine-node/integration.js && \
	node_modules/jasmine-node/bin/jasmine-node --captureExceptions --verbose tmp/node_integration

.PHONY: build_all
