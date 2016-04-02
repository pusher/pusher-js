all: web web-min web-umd react-native node worker

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

.PHONY: all
