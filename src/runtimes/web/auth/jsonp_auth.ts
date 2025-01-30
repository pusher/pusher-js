import Browser from '../browser';
import Logger from 'core/logger';
import JSONPRequest from '../dom/jsonp_request';
import { ScriptReceivers } from '../dom/script_receiver_factory';
import { AuthTransport } from 'core/auth/auth_transports';
import {
  AuthRequestType,
  AuthTransportCallback,
  InternalAuthOptions,
} from 'core/auth/options';

var jsonp: AuthTransport = function (
  context: Browser,
  query: string,
  authOptions: InternalAuthOptions,
  authRequestType: AuthRequestType,
  callback: AuthTransportCallback,
) {
  if (
    authOptions.headers !== undefined ||
    authOptions.headersProvider != null
  ) {
    Logger.warn(
      `To send headers with the ${authRequestType.toString()} request, you must use AJAX, rather than JSONP.`,
    );
  }

  var callbackName = context.nextAuthCallbackID.toString();
  context.nextAuthCallbackID++;

  var document = context.getDocument();
  var script = document.createElement('script');
  // Hacked wrapper.
  context.auth_callbacks[callbackName] = function (data) {
    callback(null, data);
  };

  var callback_name = "Pusher.auth_callbacks['" + callbackName + "']";
  script.src =
    authOptions.endpoint +
    '?callback=' +
    encodeURIComponent(callback_name) +
    '&' +
    query;

  var head =
    document.getElementsByTagName('head')[0] || document.documentElement;
  head.insertBefore(script, head.firstChild);
};

export default jsonp;
