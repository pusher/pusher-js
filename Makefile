lint:
	gjslint -r src -e web-socket-js -x json2.js,web-socket-js-licence.js --nojsdoc

.PHONY: lint