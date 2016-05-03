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

  config.webpack.resolve.modulesDirectories = [
    'node_modules',
    'web_modules',
    'src',
    'src/runtimes/worker',
    'src/runtimes',
    'spec/javascripts/helpers'
  ]
  config.webpack.externals.testenv = "'worker'";
  return config;
}
