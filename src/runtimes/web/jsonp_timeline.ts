export default var jsonp = function(sender : TimelineSender, encrypted : boolean): TimelineTransport {
  return function(data : any, callback : Function) {
    var scheme = "http" + (encrypted ? "s" : "") + "://";
    var url = scheme + (sender.host || sender.options.host) + sender.options.path + "/jsonp";
    var request = Factory.createJSONPRequest(url, data);

    var receiver = Runtime.ScriptReceivers.create(function(error, result){
      ScriptReceivers.remove(receiver);
      request.cleanup();

      if (result && result.host) {
        sender.host = result.host;
      }
      if (callback) {
        callback(error, result);
      }
    });
    request.send(receiver);
  }
};
