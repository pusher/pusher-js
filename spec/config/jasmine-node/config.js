var jasmine = require('jasmine-node');
var SpecReporter = require('jasmine-spec-reporter');
var path = process.argv[2];

jasmine.executeSpecsInFolder({
  specFolders: [path],
  showColors: true
});

jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: true}));
