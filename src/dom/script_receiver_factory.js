(function() {
  function ScriptReceiverFactory(prefix, name) {
    this.lastId = 0;
    this.prefix = prefix;
    this.name = name;
  }
  var prototype = ScriptReceiverFactory.prototype;

  prototype.create = function(callback) {
    this.lastId++;

    var number = this.lastId;
    var id = this.prefix + number;
    var name = this.name + "[" + number + "]";

    this[number] = callback;
    return { number: number, id: id, name: name, callback: callback };
  };

  prototype.remove = function(receiver) {
    delete this[receiver.number];
  };

  Pusher.ScriptReceiverFactory = ScriptReceiverFactory;
}).call(this);
