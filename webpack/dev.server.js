var config = require('./config.web');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');

var port = parseInt(process.env.PORT) || 5555;

config.entry.app = [
  'webpack-dev-server/client?http://localhost:' + port + '/',
  'webpack/hot/dev-server',
];

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
  hot: true,
});

server.listen(port);
