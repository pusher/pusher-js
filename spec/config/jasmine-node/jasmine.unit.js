var jasmine = require('jasmine-node');
var SpecReporter = require('jasmine-spec-reporter');

jasmine.executeSpecsInFolder({
  specFolders: ['./tmp/node_unit'],
  showColors: true
});

jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: true}));
