/*
Takes + modifies existing Karma config + the name of the suite,
i.e. 'unit' or 'integration'.
Sorts out the module resolution for this build and changes
the testenv.
*/

module.exports = function(suite) {
  var index = '**/spec/javascripts/'+suite+'/index.worker.js'
  config = {
    frameworks: ['jasmine-web-worker'],
    files: [index],
    preprocessors: {
      [index]: ['webpack']
    },
    webpack: { 
      resolve: {
        modules: [
          'src/runtimes/worker',
        ],
        alias:{
          'dom/dependencies': 'worker/mock-dom-dependencies'
        }
      },
      externals: {
        testenv: "'worker'"
      }
    }
  }

  return config;
}
