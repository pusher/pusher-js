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
      },
      {
        pattern: /<CDN_HTTP>/ig,
        replacement: function(){
          return libConfig.js.cdn.http;
        }
      },
      {
        pattern: /<CDN_HTTPS>/ig,
        replacement: function(){
          return libConfig.js.cdn.https;
        }
      }
    ]
  })
}