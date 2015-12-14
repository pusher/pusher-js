var StringReplacePlugin = require('string-replace-webpack-plugin');
var libConfig = require('./library_config')[process.env.ENVIRONMENT || "development"];

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
