import Browser from '../browser';
import Logger from 'core/logger';
import JSONPRequest from '../dom/jsonp_request';
import { ScriptReceivers } from '../dom/script_receiver_factory';
import { AuthTransport } from 'core/auth/auth_transports';
import { AuthorizerCallback } from 'core/auth/options';

var jsonp: AuthTransport = function(
  context: Browser,
  socketId: string,
  callback: AuthorizerCallback
) {
  if (this.authOptions.headers !== undefined) {
    Logger.warn(
      'To send headers with the auth request, you must use AJAX, rather than JSONP.'
    );
  }

  var callbackName = context.nextAuthCallbackID.toString();
  context.nextAuthCallbackID++;

  var document = context.getDocument();
  var script = document.createElement('script');
  // Hacked wrapper.
  context.auth_callbacks[callbackName] = function(data) {
    callback(null, data);
  };

  var callback_name = "Pusher.auth_callbacks['" + callbackName + "']";
  script.src =
    this.options.authEndpoint +
    '?callback=' +
    encodeURIComponent(callback_name) +
    '&' +
    this.composeQuery(socketId);

  var head =
    document.getElementsByTagName('head')[0] || document.documentElement;
  head.insertBefore(script, head.firstChild);
};

export default jsonp;
