var config = require('./config.web');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');

var port = parseInt(process.env.PORT) || 5555;

var compiler = webpack(config);
var server = new WebpackDevServer({ hot: true, port: port }, compiler);

server.start();
