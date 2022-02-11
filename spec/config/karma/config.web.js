
module.exports = {
  frameworks: ["jasmine"],
  files: ['**/spec/javascripts/unit/index.web.js'],
  preprocessors: {
    '**/spec/javascripts/unit/index.web.js': ['webpack']
  },
  webpack: {
    resolve: {
      modules: [
        'src/runtimes/web',
      ]
    },
    externals: {
      testenv: "'web'"
    }
  }
};
