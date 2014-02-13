(function() {
  function ScriptReceiverFactory(prefix, name) {
    this.lastId = 0;
    this.prefix = prefix;
    this.name = name;
  }
  var prototype = ScriptReceiverFactory.prototype;

  prototype.create = function(callback) {
    this.lastId++;

    var id = this.prefix + this.lastId;
    var name = this.name + "." + id;

    this[id] = callback;
    return { id: id, name: name, callback: callback };
  };

  prototype.remove = function(receiver) {
    delete this[receiver.id];
  };

  Pusher.ScriptReceiverFactory = ScriptReceiverFactory;
}).call(this);
