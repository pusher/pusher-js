;(function() {

  function TestXHR() {
    this.onreadystatechange = undefined;

    // states
    this.UNSENT = 0;
    this.OPENED = 1;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.DONE = 4;
    this.readyState = 0;

    // response
    this.status = undefined;
    this.statusText = undefined;
    this.responseText = undefined;
    this.responseXML = undefined;

    this._args = {
      open: undefined,
      setRequestHeader: undefined,
      send: undefined
    };

    this._headers = {};

    TestXHR.instances.push(this);
  }

  TestXHR.original = XMLHttpRequest;
  TestXHR.instances = [];
  TestXHR.lastInstance = function() {
    return TestXHR.instances[TestXHR.instances.length - 1];
  };

  TestXHR.prototype.open = function(method, url, async, user, password) {
    this._args.open = arguments;
    this.readyState = this.OPENED;
    this.onreadystatechange && this.onreadystatechange.call(this);
  };

  TestXHR.prototype.setRequestHeader = function(header, value) {
    this._args.setRequestHeader = arguments;
  };

  TestXHR.prototype.send = function(data) {
    this._args.send = arguments;
    this.onreadystatechange && this.onreadystatechange.call(this);
  };

  TestXHR.prototype.abort = function() {
    this.readyState = this.DONE;
    this.onreadystatechange && this.onreadystatechange.call(this);
  };

  TestXHR.prototype.getResponseHeader = function(header) {
    return this._headers[header];
  };

  TestXHR.prototype.getAllResponseHeaders = function() {
    return this._headers;
  };

  TestXHR.prototype.trigger = function(state, updatedXHRObject) {
    for (var prop in updatedXHRObject) {
      if (updatedXHRObject.hasOwnProperty(prop)) {
        this[prop] = updatedXHRObject[prop];
      }
    }

    this.readyState = this[state.toUpperCase()];
    this.onreadystatechange && this.onreadystatechange.call(this);
  };

  this.TestXHR = TestXHR;
}).call(this);