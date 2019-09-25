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
  resolve: {
    modules: ['src/runtimes/react-native'],
    // at the moment, react-native doesn't contain the requisite crypto APIs to
    // use tweetnacl/tweetnacl-utils.
    //
    // As a result encrypted channels cannot be supported in react native at
    // this time. In order for the build to work, we need to replace the
    // tweetnacl-utils with 'mocks'
    alias: {
      tweetnacl: path.resolve(
        __dirname,
        '../src/runtimes/react-native/tweetnacl-dummy.ts'
      ),
      'tweetnacl-util': path.resolve(
        __dirname,
        '../src/runtimes/react-native/tweetnacl-util-dummy.ts'
      )
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      RUNTIME: JSON.stringify('react-native')
    })
  ]
});
