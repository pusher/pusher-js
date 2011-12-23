;(function() {
  // Create a new object, that prototypally inherits from the Error constructor.
  function InvalidStateError() {
      this.name = "InvalidStateError";
  }
  InvalidStateError.prototype = new Error();
  InvalidStateError.prototype.constructor = InvalidStateError;


  /**
   * TestSocket is a object for faking a WebSocket.
   *
   * Should implement the WebSocket IDL reasonably well,
   * asides from the DOMEvents interface, which could be
   * added easily if need be, but adds complexity.
   *
   * USAGE:
   *    ;(function() {
   *      // 1. Use a closure and overwrite the native WebSocket.
   *      var WebSocket = TestSocket;
   *
   *      // 2. Listen for WebSocket.prototype.send();
   *      WebSocket.prototype.onsend = function(message) {
   *        console.log(message);
   *      };
   *
   *      // 3. Create a WebSocket.
   *      var mySocket = new WebSocket('ws://ws.pusherapp.com/foo/bar');
   *
   *      // 3. ????
   *      mySocket.onopen = function() {...};
   *      mySocket.send('hello world');
   *
   *      // 4. Profit! Or, how about write some tests.
   *      mySocket.trigger('open');
   *      mySocket.trigger('message', 'Hello Back!');
   *      mySocket.trigger('close');
   *      mySocket.trigger('error');
   *    })();
   *
   *
   * @constructor
   * @implements http://dev.w3.org/html5/websockets/#the-websocket-interface
   * @param {string}            url         See the WebSocket IDL.
   * @param {string|string[]}   protocols   See the WebSocket IDL.
  **/
  var TestSocket = function(url, protocols) {
    this.URL = this.url = url;
    this.protocol = protocols || [];

    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;

    this.readyState = 0;
    this.bufferedAmount = 0;

    // client-sent:
    this._sendQueue = [];

    this.onopen = noop;
    this.onmessage = noop;
    this.onerror = noop;
    this.onclose = noop;

    // hooks:
    this._onclose = noop;
    this._onsend = noop;
  };


  function defer(callback, thisArg, args) {
    return setTimeout(function() {
      callback.apply(thisArg, (args || []));
    }, 0);
  }

  function noop() {};

  /**
   * Spins off to onsend, so you can test.
   *
   * @see http://dev.w3.org/html5/websockets/#the-websocket-interface
  **/
  TestSocket.prototype.send = function(data) {
    var socket = this;

    //if (socket.readyState === socket.CONNECTING) throw new InvalidStateError();
    if (socket.readyState !== socket.OPEN) return false;

    socket._sendQueue.push(data);

    defer(function() {
      socket._onsend.call(socket, data);
    });

    return true;
  };

  /**
   * Calls onclose, and sets state accordingly
   *
   * @see http://dev.w3.org/html5/websockets/#the-websocket-interface
  **/
  TestSocket.prototype.close = function() {
    var socket = this;

    if (socket.readyState !== socket.CLOSING && socket.readyState !== socket.CLOSED) {
      socket.readyState = socket.CLOSING;

      defer(function() {
        socket.readyState = socket.CLOSED;
        if (typeof socket.onclose === 'function') {
          socket.onclose.call(socket);
        }
        if (socket._onclose) { socket._onclose(); }
      });
    }
  };

  /**
   * Trigger a callback on the socket, not part of the WebSocket IDL.
   *
   * @param {string}  method  The method to invoke, callback name without the 'on'.
   * @param {string}  message The message value for the `message` event.
  **/
  TestSocket.prototype.trigger = function(method, message) {
    var socket = this;
    switch (method) {
      case 'open':
        defer(function() {
          socket.readyState = socket.OPEN;
          if (typeof socket.onopen === 'function') {
            socket.onopen.call(socket);
          }
        });
        break;
      case 'message':
        defer(function() {
          if (typeof socket.onmessage === 'function') {
            socket.onmessage.call(this, {data: message});
          }
        });
        break;
      case 'close':
        if (socket.readyState !== socket.CLOSING && socket.readyState !== socket.CLOSED) {
          defer(function() {
            socket.readyState = socket.CLOSING;

            defer(function() {
              socket.readyState = socket.CLOSED;
              if (typeof socket.onclose === 'function') {
                socket.onclose.call(socket);
              }
            });
          });
        }
        break;
      case 'error':
        defer(function() {
          if (typeof socket.onerror === 'function') {
            socket.onerror.call(socket);
          }
        });
        break;
    }
  };

  TestSocket.prototype.lastSent = function() {
    return this._sendQueue[this._sendQueue.length];
  };

  this.TestSocket = TestSocket;
}).call(this);
