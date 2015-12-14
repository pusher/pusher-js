var StringReplacePlugin = require('string-replace-webpack-plugin');

module.exports = {
  loader: StringReplacePlugin.replace({
    replacements: [
      {
        pattern: /<VERSION>/ig,
        replacement: function() {
          var packageJSON = require('../package');
          return packageJSON.version;
        }
      }
    ]
  })
}
