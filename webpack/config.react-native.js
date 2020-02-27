var path = require('path');
var NormalModuleReplacementPlugin = require('webpack')
  .NormalModuleReplacementPlugin;
var version = require('../package').version;
var objectAssign = require('object-assign-deep');
var configShared = require('./config.shared');
var webpack = require('webpack');

module.exports = objectAssign({}, configShared, {
  output: {
    library: 'Pusher',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist/react-native'),
    filename: 'pusher.js'
  },
  target: 'node',
  externals: {
    // our Reachability implementation needs to reference @react-native-community/netinfo.
    '@react-native-community/netinfo': '@react-native-community/netinfo'
  },
  // React Native implementation not using randomBytes generation of tweenacl and therefore require("crypto"),
  // we're decieving the tweetnacl, that we're not Node platform and not including require("crypto") into the pusher
  // Partly from tweetnacl wiki https://github.com/dchest/tweetnacl-js/wiki/Using-with-Webpack
  module: {
    rules: [
      {
        test: /[\\\/]tweetnacl[\\\/]/,
        use: 'imports-loader?require\=\>undefined'
     }
    ],
    noParse: [
      /[\\\/]tweetnacl[\\\/]/,
    ],
  },
  resolve: {
    modules: ['src/runtimes/react-native'],
    alias: {
      // Using stable libs instead of tweetnacl-utils like the owner is suggesting
      // https://github.com/dchest/tweetnacl-util-js/blob/master/README.md#notice
      'tweetnacl-util': path.resolve(
        __dirname,
        '../src/runtimes/react-native/tweetnacl-util-rn.ts'
      )
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      RUNTIME: JSON.stringify('react-native')
    })
  ]
});
