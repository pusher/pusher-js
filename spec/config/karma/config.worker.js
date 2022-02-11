/*
Takes + modifies existing Karma config + the name of the suite,
i.e. 'unit' or 'integration'.
Sorts out the module resolution for this build and changes
the testenv.
*/

module.exports = {
  // frameworks: ['jasmine'],
  frameworks: ['jasmine-web-worker'],
  files: ['**/spec/javascripts/unit/index.worker.js'],
  preprocessors: {
    '**/spec/javascripts/unit/index.worker.js': ['webpack']
  },
  webpack: { 
    resolve: {
      modules: [
        'src/runtimes/worker',
        'node_modules'
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
