import ScriptReceiver from './script_receiver';
import ScriptRequest from './script_request';
import * as Collections from 'core/utils/collections';
import Util from 'core/util';
import Runtime from '../runtime';

/** Sends data via JSONP.
 *
 * Data is a key-value map. Its values are JSON-encoded and then passed
 * through base64. Finally, keys and encoded values are appended to the query
 * string.
 *
 * The class itself does not guarantee raising errors on failures, as it's not
 * possible to support such feature on all browsers. Instead, JSONP endpoint
 * should call back in a way that's easy to distinguish from browser calls,
 * for example by passing a second argument to the receiver.
 *
 * @param {String} url
 * @param {Object} data key-value map of data to be submitted
 */
export default class JSONPRequest {
  url: string;
  data: any;
  request: ScriptRequest;

  constructor(url: string, data: any) {
    this.url = url;
    this.data = data;
  }

  /** Sends the actual JSONP request.
   *
   * @param {ScriptReceiver} receiver
   */
  send(receiver: ScriptReceiver) {
    if (this.request) {
      return;
    }

    var query = Collections.buildQueryString(this.data);
    var url = this.url + '/' + receiver.number + '?' + query;
    this.request = Runtime.createScriptRequest(url);
    this.request.send(receiver);
  }

  /** Cleans up the DOM remains of the JSONP request. */
  cleanup() {
    if (this.request) {
      this.request.cleanup();
    }
  }
}
