/*
Takes + modifies existing Karma config + the name of the suite,
i.e. 'unit' or 'integration'.
Sorts out the module resolution for this build and changes
the testenv.
*/
module.exports = function(config, suite) {
  config.frameworks = ["jasmine-web-worker"];
  config.files = [
    '**/spec/javascripts/'+suite+'/index.worker.js'
  ];

  config.preprocessors = {
    '**/spec/javascripts/node_modules/**/*.ts': ['webpack'],
    '**/spec/javascripts/helpers/**/*.js': ['webpack']
  };

  var index = '**/spec/javascripts/'+suite+'/index.worker.js';
  config.preprocessors[index] = ['webpack'];

  config.webpack.resolve.modules = [
    'node_modules',
    'web_modules',
    'src',
    'src/runtimes/worker',
    'src/runtimes',
    'spec/javascripts/helpers'
  ]
  config.webpack.resolve.alias = {
    'dom/dependencies': 'worker/mock-dom-dependencies',
  }
  config.webpack.externals.testenv = "'worker'";
  return config;
}
