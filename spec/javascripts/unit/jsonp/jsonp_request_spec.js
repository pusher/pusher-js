var Mocks = require('mocks');
var JSONPRequest = require('jsonp/jsonp_request');
var ScriptRequest = require('dom/script_request');
var Integration = require('integration');

describe("JSONPRequest", function() {
  var callback;
  var receiver;
  var scriptRequest;

  beforeEach(function() {
    spyOn(Pusher, "ScriptRequest").andCallFake(function() {
      scriptRequest = Mocks.getScriptRequest();
      return scriptRequest;
    });
    callback = jasmine.createSpy();
    receiver = Integration.ScriptReceivers.create(callback);
  });

  describe("#send", function() {
    it("should send the script request to a correct URL", function() {
      var request = new JSONPRequest("http://example.com", {});
      request.send(receiver);
      expect(ScriptRequest.calls.length).toEqual(1);
      expect(ScriptRequest).toHaveBeenCalledWith(
        "http://example.com/" + receiver.number + "?"
      );
      expect(scriptRequest.send).toHaveBeenCalledWith(receiver);
    });

    it("should call back after the script request is completed", function() {
      var request = new JSONPRequest("http://example.org", {});
      request.send(receiver);
      expect(callback).not.toHaveBeenCalled();
      scriptRequest.send.calls[0].args[0].callback("first", "second");
      expect(callback).toHaveBeenCalledWith("first", "second");
    });

    it("should concatenate multiple keys correctly", function() {
      var request = new JSONPRequest("http://example.org", {
        a: 1,
        b: 2,
        c: 3
      });

      request.send(receiver);
      var url = ScriptRequest.calls[0].args[0];
      var queryString = url.match(/http:\/\/example.org\/[0-9]+\?(.*)$/)[1];
      var queryStringPairs = queryString.split("&");
      expect(queryStringPairs.length).toEqual(3);
      expect(queryStringPairs).toContain("a=MQ%3D%3D");
      expect(queryStringPairs).toContain("b=Mg%3D%3D");
      expect(queryStringPairs).toContain("c=Mw%3D%3D");
    });

    it("should not include undefined values", function() {
      var request = new JSONPRequest("http://example.org", {
        test: undefined,
      });

      request.send(receiver);
      expect(ScriptRequest).toHaveBeenCalledWith(
        "http://example.org/" + receiver.number + "?"
      );
    });

    it("should encode string parameters correctly", function() {
      var request = new JSONPRequest("http://example.org", {
        test: "foo foo",
      });

      request.send(receiver);
      expect(ScriptRequest).toHaveBeenCalledWith(
        "http://example.org/" + receiver.number + "?test=Zm9vIGZvbw%3D%3D"
      );
    });

    it("should encode numers correctly", function() {
      var request = new JSONPRequest("http://example.org", {
        something: 1111
      });

      request.send(receiver);
      expect(ScriptRequest).toHaveBeenCalledWith(
        "http://example.org/" + receiver.number + "?something=MTExMQ%3D%3D"
      );
    });

    it("should encode arrays correctly", function() {
      var request = new JSONPRequest("http://example.org", {
        arrr: [1, 2, "string", 123.456]
      });

      request.send(receiver);
      expect(ScriptRequest).toHaveBeenCalledWith(
        "http://example.org/" + receiver.number + "?arrr=WzEsMiwic3RyaW5nIiwxMjMuNDU2XQ%3D%3D"
      );
    });

    it("should encode objects correctly", function() {
      var request = new JSONPRequest("http://example.org", {
        obj: { key: "val", num: 123, fl: 666.999 }
      });

      request.send(receiver);
      expect(ScriptRequest).toHaveBeenCalledWith(
        "http://example.org/" + receiver.number + "?obj=eyJrZXkiOiJ2YWwiLCJudW0iOjEyMywiZmwiOjY2Ni45OTl9"
      );
    });

    it("should be idempotent", function() {
      var request = new JSONPRequest("http://example.org", {});
      request.send(receiver);
      expect(ScriptRequest.calls.length).toEqual(1);
      request.send(receiver);
      expect(ScriptRequest.calls.length).toEqual(1);
    });
  });

  describe("#cleanup", function() {
    it("should call cleanup on the script request", function() {
      var request = new JSONPRequest("http://example.com", {});
      request.send(receiver);
      expect(ScriptRequest.calls.length).toEqual(1);
      expect(scriptRequest.cleanup).not.toHaveBeenCalled();
      request.cleanup();
      expect(scriptRequest.cleanup).toHaveBeenCalled();
    });
  });
});
