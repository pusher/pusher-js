;(function(){

  function Runtime(context){
    this.context = context;
  };

  function BrowserRuntime(context){
    this.context = context;
  }

  function NonBrowserRuntime(context){
    this.context = context;
  }

  Runtime.prototype.getWindow = function() {
    return this.context;
  };

  BrowserRuntime.prototype = new Runtime();
  BrowserRuntime.prototype.constructor = BrowserRuntime;

  BrowserRuntime.prototype.getDocument = function(){
    return this.context.document;
  }

  NonBrowserRuntime.prototype = new Runtime();
  NonBrowserRuntime.prototype.constructor = NonBrowserRuntime;

  NonBrowserRuntime.prototype.getDocument = function(){
    return this.context;
  }

  this._PusherRuntimes = {
    Browser: BrowserRuntime,
    NonBrowser: NonBrowserRuntime
  }

}).call(this);