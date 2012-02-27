;(function(){
  Tests.addSuite('core', {
    'Sanity check for environment': function(test) {
      test.numAssertions = 3;

      test.equal(typeof window['JSON'], 'object', 'The JSON object should be defined.');
      test.equal(typeof JSON.parse, 'function', 'The JSON.parse method should be defined.');
      test.equal(typeof JSON.stringify, 'function', 'The JSON.stringify method should be defined.');
      test.finish();
    }
  });
})();
