var globalScope = require('../../util').getGlobal();

module.exports = globalScope.WebSocket || globalScope.MozWebSocket;