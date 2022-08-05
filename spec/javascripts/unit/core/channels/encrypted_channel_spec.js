const Errors = require("core/errors");
const Logger = require('core/logger').default;
const EncryptedChannel = require("core/channels/encrypted_channel").default;
const Mocks = require("mocks");
const nacl = require("tweetnacl");
const utf8 = require("@stablelib/utf8");
const base64 = require("@stablelib/base64");

describe("EncryptedChannel", function() {
  var pusher;
  var channel;
  var channelAuthorizer;
  const secretUTF8 = "It Must Be Thirty Two Characters";
  const secretBytes = utf8.encode(secretUTF8);
  const secretBase64 = base64.encode(secretBytes);
  const nonceUTF8 = "aaaaaaaaaaaaaaaaaaaaaaaa";
  const nonceBytes = utf8.encode(nonceUTF8);
  const nonceBase64 = base64.encode(nonceBytes);
  const testEncrypt = function(payload) {
    let payloadBytes = utf8.encode(JSON.stringify(payload));
    let bytes = nacl.secretbox(payloadBytes, nonceBytes, secretBytes);
    return base64.encode(bytes);
  };

  beforeEach(function() {
    channelAuthorizer = jasmine.createSpy("channelAuthorizer").and.callFake(function(params, callback) {})
    pusher = Mocks.getPusher({ channelAuthorizer: channelAuthorizer });
    channel = new EncryptedChannel("private-encrypted-test", pusher, nacl);
  });

  describe("after construction", function() {
    it("#subscribed should be false", function() {
      expect(channel.subscribed).toEqual(false);
    });

    it("#subscriptionPending should be false", function() {
      expect(channel.subscriptionPending).toEqual(false);
    });

    it("#subscriptionCancelled should be false", function() {
      expect(channel.subscriptionCancelled).toEqual(false);
    });
  });

  describe("#authorize", function() {
    it("should call channelAuthorizer", function() {
      const callback = function(){}
      channel.authorize("1.23", callback);
      expect(channelAuthorizer.calls.count()).toEqual(1);
      expect(channelAuthorizer).toHaveBeenCalledWith(
        { socketId: "1.23", channelName: "private-encrypted-test" }, jasmine.any(Function));
    });

    it("should call the callback if an authorizaiton error is encountered", function() {
      const callback = jasmine.createSpy("callback")
      channel.authorize("1.23", callback);
      expect(channelAuthorizer.calls.count()).toEqual(1);
      expect(channelAuthorizer).toHaveBeenCalledWith(
        { socketId: "1.23", channelName: "private-encrypted-test" }, jasmine.any(Function));
      const encryptedChannelCallback = channelAuthorizer.calls.mostRecent().args[1];
      
      encryptedChannelCallback("error", {})
      expect(callback).toHaveBeenCalledWith("error", {})
    });

    it("should fail if AuthData doens't have a shared_secret", function() {
      const callback = jasmine.createSpy("callback")
      channel.authorize("1.23", callback);
      expect(channelAuthorizer.calls.count()).toEqual(1);
      expect(channelAuthorizer).toHaveBeenCalledWith(
        { socketId: "1.23", channelName: "private-encrypted-test" }, jasmine.any(Function));
      const encryptedChannelCallback = channelAuthorizer.calls.mostRecent().args[1];
      
      encryptedChannelCallback(null, {})
      
      expect(callback.calls.count()).toEqual(1)
      let args = callback.calls.first().args;
      expect(args.length).toEqual(2)
      expect(args[0]).toEqual(jasmine.any(Error))
      expect(args[0].message).toEqual(
        "No shared_secret key in auth payload for encrypted channel: private-encrypted-test"
      );
      expect(args[1]).toEqual(null);
    });
    
    it("should succeed if AuthData has a shared_secret", function() {
      const callback = jasmine.createSpy("callback")
      channel.authorize("1.23", callback);
      expect(channelAuthorizer.calls.count()).toEqual(1);
      expect(channelAuthorizer).toHaveBeenCalledWith(
        { socketId: "1.23", channelName: "private-encrypted-test" }, jasmine.any(Function));
      const encryptedChannelCallback = channelAuthorizer.calls.mostRecent().args[1];
      
      encryptedChannelCallback(null, {
        shared_secret: secretBase64,
        foo: 'bar',
      })
      expect(callback).toHaveBeenCalledWith(null, {
        foo: 'bar',
      })
    });
  });

  describe("#trigger", function() {
    beforeEach(function() {
      let callback = function() {};
      channel.authorize("1.23", callback);
    });
    it("should raise an exception if called", function() {
      expect(() => channel.trigger('whatever', {})).toThrow(
        jasmine.any(Errors.UnsupportedFeature)
      );
    });
  });

  describe("#disconnect", function() {
    it("should set subscribed to false", function() {
      channel.handleEvent({
        event: "pusher_internal:subscription_succeeded"
      });
      channel.disconnect();
      expect(channel.subscribed).toEqual(false);
    });
  });

  describe("#handleEvent", function() {
    it("should not emit pusher_internal:* events", function() {
      let callback = jasmine.createSpy("callback");
      channel.bind("pusher_internal:test", callback);
      channel.bind_global(callback);

      channel.handleEvent({
        event: "pusher_internal:test"
      });

      expect(callback).not.toHaveBeenCalled();
    });

    describe("on pusher_internal:subscription_succeeded", function() {
      it("should emit pusher:subscription_succeeded", function() {
        let callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(callback).toHaveBeenCalledWith("123");
      });

      it("should set #subscribed to true", function() {
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(channel.subscribed).toEqual(true);
      });

      it("should set #subscriptionPending to false", function() {
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(channel.subscriptionPending).toEqual(false);
      });
    });

    describe("pusher_internal:subscription_succeeded but subscription cancelled", function() {
      it("should not emit pusher:subscription_succeeded", function() {
        let callback = jasmine.createSpy("callback");
        channel.bind("pusher:subscription_succeeded", callback);
        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(callback).not.toHaveBeenCalled();
      });

      it("should set #subscribed to true", function() {
        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(channel.subscribed).toEqual(true);
      });

      it("should set #subscriptionPending to false", function() {
        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(channel.subscriptionPending).toEqual(false);
      });

      it("should call #pusher.unsubscribe", function() {
        expect(pusher.unsubscribe).not.toHaveBeenCalled();
        channel.cancelSubscription();
        channel.handleEvent({
          event: "pusher_internal:subscription_succeeded",
          data: "123"
        });
        expect(pusher.unsubscribe).toHaveBeenCalledWith(channel.name);
      });
    });

    describe("on other events", function() {
      beforeEach(function() {
        channelAuthorizer.and.callFake(function(params, callback) {
          callback(null, {
            shared_secret: secretBase64,
            foo: 'bar',
          });
        });
        
        channel.authorize("1.23", function (){});
      });
      it("should decrypt the event payload and emit the event", function() {
        let payload = { test: "payload" };
        let encryptedPayload = {
          nonce: nonceBase64,
          ciphertext: testEncrypt(payload)
        };
        let boundCallback = jasmine.createSpy("boundCallback");
        channel.bind("something", boundCallback);
        channel.handleEvent({
          event: "something",
          data: encryptedPayload
        });
        expect(boundCallback).toHaveBeenCalledWith(payload);
      });
      it("should emit pusher: prefixed events unmodified", function() {
        let payload = { test: "payload" };
        let boundCallback = jasmine.createSpy("boundCallback");
        channel.bind("pusher:subscription_error", boundCallback);
        channel.handleEvent({
          event: "pusher:subscription_error",
          data: payload
        });
        expect(boundCallback).toHaveBeenCalledWith(payload, {});
      });
      it("should not swallow errors thrown by the handler", function() {
        // previously, if the handler threw an error, when called with the
        // parsed json, we tried again with a string. This test aims to check
        // that an error thrown by a handler should not be caught by the lib
        let payload = { test: "payload" };
        let encryptedPayload = {
          nonce: nonceBase64,
          ciphertext: testEncrypt(payload)
        };
        let callCount = 0;
        channel.bind("something", (data)=> {
          if (callCount == 0) {
            callCount++;
            throw new Error("some error");
          }
        })
        expect(function() {
          channel.handleEvent({
            event: "something",
            data: encryptedPayload
          });
        }).toThrow()
      });

      describe("with rotated shared key", function() {
        const newSecretUTF8 = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        const newSecretBytes = utf8.encode(newSecretUTF8);
        const newSecretBase64 = base64.encode(newSecretBytes);
        const newTestEncrypt = function(payload) {
          let payloadBytes = utf8.encode(JSON.stringify(payload));
          let bytes = nacl.secretbox(payloadBytes, nonceBytes, newSecretBytes);
          return base64.encode(bytes);
        };

        beforeEach(function() {
          // Channel has already been authorized with the old secret
          channel.authorize("1.23", function (){});

          pusher.connection = {
            socket_id: "9.37"
          };

          // Next call to authorize will use the new secret
          channelAuthorizer.and.callFake(function(params, callback) {
            callback(null, {
              shared_secret: newSecretBase64,
              foo: 'bar',
            });
          });
        });

        it("should request new key from authorizer and decrypt event", function() {
          let payload = { test: "payload" };
          let encryptedPayload = {
            nonce: nonceBase64,
            ciphertext: newTestEncrypt(payload)
          };
          let boundCallback = jasmine.createSpy("boundCallback");
          channel.bind("something", boundCallback);
          channel.handleEvent({
            event: "something",
            data: encryptedPayload
          });
          expect(boundCallback).toHaveBeenCalledWith(payload);
        });
        it("should log a warning if it fails to decrypt event after requesting a new key from the auth endpoint", function() {
          let encryptedPayload = {
            nonce: nonceBase64,
            ciphertext: base64.encode('garbage-ciphertext')
          };
          spyOn(Logger, "error");
          channel.handleEvent({
            event: "something",
            data: encryptedPayload
          });
          expect(Logger.error).toHaveBeenCalledWith(
            "Failed to decrypt event with new key. Dropping encrypted event"
          );
        });
        it("should log a warning if it fails to call the auth endpoint after failing to decrypt an event", function() {
          let payload = { test: "payload" };
          let encryptedPayload = {
            nonce: nonceBase64,
            ciphertext: newTestEncrypt(payload)
          };
          spyOn(Logger, "error");
          channelAuthorizer.and.callFake(function(params, callback) {
            callback(true, "ERROR");
          });
          channel.handleEvent({
            event: "something",
            data: encryptedPayload
          });
          expect(Logger.error).toHaveBeenCalledWith(
            "Failed to make a request to the authEndpoint: ERROR. Unable to fetch new key, so dropping encrypted event"
          );
        });
      });
    });
  });
});
