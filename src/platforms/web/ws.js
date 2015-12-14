var globalScope = require('../../util').global;

module.exports = globalScope.WebSocket || globalScope.MozWebSocket;