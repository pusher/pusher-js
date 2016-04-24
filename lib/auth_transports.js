"use strict";
var logger_1 = require('./logger');
var factory_1 = require('./utils/factory');
var ajax = function (context, socketId, callback) {
    var self = this, xhr;
    xhr = factory_1.default.createXHR();
    xhr.open("POST", self.options.authEndpoint, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    for (var headerName in this.authOptions.headers) {
        xhr.setRequestHeader(headerName, this.authOptions.headers[headerName]);
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var data, parsed = false;
                try {
                    data = JSON.parse(xhr.responseText);
                    parsed = true;
                }
                catch (e) {
                    callback(true, 'JSON returned from webapp was invalid, yet status code was 200. Data was: ' + xhr.responseText);
                }
                if (parsed) {
                    callback(false, data);
                }
            }
            else {
                logger_1.default.warn("Couldn't get auth info from your webapp", xhr.status);
                callback(true, xhr.status);
            }
        }
    };
    xhr.send(this.composeQuery(socketId));
    return xhr;
};
exports.ajax = ajax;
var jsonp = function (context, socketId, callback) {
    if (this.authOptions.headers !== undefined) {
        logger_1.default.warn("Warn", "To send headers with the auth request, you must use AJAX, rather than JSONP.");
    }
    var callbackName = context.nextAuthCallbackID.toString();
    context.nextAuthCallbackID++;
    var document = context.getDocument();
    var script = document.createElement("script");
    context.auth_callbacks[callbackName] = function (data) {
        callback(false, data);
    };
    var callback_name = "Pusher.Runtime.auth_callbacks['" + callbackName + "']";
    script.src = this.options.authEndpoint +
        '?callback=' +
        encodeURIComponent(callback_name) +
        '&' +
        this.composeQuery(socketId);
    var head = document.getElementsByTagName("head")[0] || document.documentElement;
    head.insertBefore(script, head.firstChild);
};
exports.jsonp = jsonp;
//# sourceMappingURL=auth_transports.js.map