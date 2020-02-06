import ScriptReceiver from './script_receiver';

/** Sends a generic HTTP GET request using a script tag.
 *
 * By constructing URL in a specific way, it can be used for loading
 * JavaScript resources or JSONP requests. It can notify about errors, but
 * only in certain environments. Please take care of monitoring the state of
 * the request yourself.
 *
 * @param {String} src
 */
export default class ScriptRequest {
  src: string;
  script: any;
  errorScript: any;

  constructor(src: string) {
    this.src = src;
  }

  send(receiver: ScriptReceiver) {
    var self = this;
    var errorString = 'Error loading ' + self.src;

    self.script = document.createElement('script');
    self.script.id = receiver.id;
    self.script.src = self.src;
    self.script.type = 'text/javascript';
    self.script.charset = 'UTF-8';

    if (self.script.addEventListener) {
      self.script.onerror = function() {
        receiver.callback(errorString);
      };
      self.script.onload = function() {
        receiver.callback(null);
      };
    } else {
      self.script.onreadystatechange = function() {
        if (
          self.script.readyState === 'loaded' ||
          self.script.readyState === 'complete'
        ) {
          receiver.callback(null);
        }
      };
    }

    // Opera<11.6 hack for missing onerror callback
    if (
      self.script.async === undefined &&
      (<any>document).attachEvent &&
      /opera/i.test(navigator.userAgent)
    ) {
      self.errorScript = document.createElement('script');
      self.errorScript.id = receiver.id + '_error';
      self.errorScript.text = receiver.name + "('" + errorString + "');";
      self.script.async = self.errorScript.async = false;
    } else {
      self.script.async = true;
    }

    var head = document.getElementsByTagName('head')[0];
    head.insertBefore(self.script, head.firstChild);
    if (self.errorScript) {
      head.insertBefore(self.errorScript, self.script.nextSibling);
    }
  }

  /** Cleans up the DOM remains of the script request. */
  cleanup() {
    if (this.script) {
      this.script.onload = this.script.onerror = null;
      this.script.onreadystatechange = null;
    }
    if (this.script && this.script.parentNode) {
      this.script.parentNode.removeChild(this.script);
    }
    if (this.errorScript && this.errorScript.parentNode) {
      this.errorScript.parentNode.removeChild(this.errorScript);
    }
    this.script = null;
    this.errorScript = null;
  }
}
