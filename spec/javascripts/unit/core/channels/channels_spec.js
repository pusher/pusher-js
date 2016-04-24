var Channels = require('core/channels/channels').default;
var Channel = require('core/channels/channel').default;
var PrivateChannel = require('core/channels/private_channel').default;
var PresenceChannel = require('core/channels/presence_channel').default;
var Factory = require('core/utils/factory').default;
var Mocks = require("mocks");

describe("Channels", function() {
  var channels;

  beforeEach(function() {
    channels = new Channels(Factory);
  });

  describe("#add", function() {
    it("should create two different channels for different names", function() {
      var channel1 = channels.add("test1", {});
      var channel2 = channels.add("test2", {});

      expect(channel1).not.toEqual(channel2);
    });

    it("should create a channel only once", function() {
      var channel = channels.add("test", {});

      expect(channels.add("test", {})).toEqual(channel);
    });

    it("should create a regular channel when name doesn't have known prefix", function() {
      expect(channels.add("test")).toEqual(jasmine.any(Channel));
    });

    it("should create a private channel when name starts with 'private-'", function() {
      expect(channels.add("private-test")).toEqual(jasmine.any(PrivateChannel));
    });

    it("should create a presence channel when name starts with 'presence-'", function() {
      expect(channels.add("presence-test")).toEqual(jasmine.any(PresenceChannel));
    });
  });

  describe("#find", function() {
    it("should return previously inserted channels", function() {
      var channel1 = channels.add("test1", {});
      var channel2 = channels.add("test2", {});

      expect(channels.find("test1")).toEqual(channel1);
      expect(channels.find("test2")).toEqual(channel2);
    });

    it("should return undefined if channel doesn't exist", function() {
      expect(channels.find("idontexist")).toBe(undefined);
    });
  });

  describe("#remove", function() {
    it("should remove previously inserted channel", function() {
      var channel1 = channels.add("test1", {});
      var channel2 = channels.add("test2", {});

      channels.remove("test1");

      expect(channels.find("test1")).toBe(undefined);
      expect(channels.find("test2")).toEqual(channel2);
    });
  });

  describe("#disconnect", function() {
    it("should call disconnect on all channels", function() {
      var channel1 = channels.add("test1", {});
      var channel2 = channels.add("test2", {});

      spyOn(channel1, "disconnect");
      spyOn(channel2, "disconnect");
      channels.disconnect();

      expect(channel1.disconnect).toHaveBeenCalled();
      expect(channel2.disconnect).toHaveBeenCalled();
    });
  });
});
