const Errors = require("core/errors");
const Logger = require('core/logger').default;
const EncryptedChannel = require("core/channels/encrypted_channel").default;
const Factory = require("core/utils/factory").default;
const Mocks = require("mocks");
const nacl = require("tweetnacl");
const utf8 = require("@stablelib/utf8");
const base64 = require("@stablelib/base64");

describe("EncryptedChannel", function() {
  var pusher;
  var channel;
  var authorizer;
  var factorySpy;
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
    pusher = Mocks.getPusher({ foo: "bar" });
    channel = new EncryptedChannel("private-encrypted-test", pusher, nacl);
    authorizer = Mocks.getAuthorizer();
    factorySpy = spyOn(Factory, "createAuthorizer").andReturn(authorizer);
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
    it("should create and call an authorizer", function() {
      channel.authorize("1.23", function() {});
      expect(Factory.createAuthorizer.calls.length).toEqual(1);
      expect(Factory.createAuthorizer).toHaveBeenCalledWith(channel, {
        foo: "bar"
      });
    });

    it("should call back with only authorization data", function() {
      let callback = jasmine.createSpy("callback");
      channel.authorize("1.23", callback);
      expect(callback).not.toHaveBeenCalled();
      authorizer._callback(false, {
        shared_secret: secretBase64,
        foo: "bar"
      });
      expect(callback).toHaveBeenCalledWith(null, { foo: "bar" });
    });

    it("should callback an error if no shared_secret included in auth data", function() {
      let callback = jasmine.createSpy("callback");
      channel.authorize("1.23", callback);
      authorizer._callback(null, {
        foo: "bar"
      });
      // For some reason comparing the Error types doesn't work properly in
      // Safari on Mojave. Manually check the arguments.
      expect(callback.calls.length).toEqual(1)
      let args = callback.calls[0].args;
      expect(args.length).toEqual(2)
      expect(args[0]).toEqual(jasmine.any(Error))
      expect(args[0].message).toEqual(
        "No shared_secret key in auth payload for encrypted channel: private-encrypted-test"
      );
      expect(args[1]).toEqual(null);
    });

    describe("with custom authorizer", function() {
      beforeEach(function() {
        pusher = Mocks.getPusher({
          authorizer: function(channel, options) {
            return authorizer;
          }
        });
        channel = new EncryptedChannel("private-test-custom-auth", pusher, nacl);
        factorySpy.andCallThrough();
      });

      it("should call the authorizer", function() {
        let callback = jasmine.createSpy("callback");
        channel.authorize("1.23", callback);
        authorizer._callback(false, {
          shared_secret: secretBase64,
          foo: "bar"
        });
        expect(callback).toHaveBeenCalledWith(null, { foo: "bar" });
      });
    });
  });

  describe("#trigger", function() {
    beforeEach(function() {
      let callback = function() {};
      channel.authorize("1.23", callback);
    });
    it("should raise an exception if called", function() {
      // we can't use toThrow with jasmine.any because it compares
      // (exception.message || exception) with (expected.message || expected)
      // the thrown exception has a message so it's passed to the matcher. The
      // message is a string, and *not* an instanceof the expected class
      // https://github.com/jasmine/jasmine/blob/v1.3.1/src/core/Matchers.js#L331-L333
      var exception;
      try {
        channel.trigger("whatever", {});
      } catch(e) {
        exception = e;
      }
      expect(exception).toMatch(jasmine.any(Errors.UnsupportedFeature));
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
        // in order to decrypt encrypted events, we need to get a shared secret
        // from the authorizer.
        let callback = function() {};
        channel.authorize("1.23", callback);
        authorizer._callback(false, {
          shared_secret: secretBase64,
          foo: "bar"
        });
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
          pusher.connection = {
            socket_id: "9.37"
          };
          authorizer._callback = null
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
          authorizer._callback(false, {
            shared_secret: newSecretBase64,
            foo: "bar"
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
          authorizer._callback(false, {
            shared_secret: newSecretBase64,
            foo: "bar"
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
          channel.handleEvent({
            event: "something",
            data: encryptedPayload
          });
          authorizer._callback(true, "ERROR");
          expect(Logger.error).toHaveBeenCalledWith(
            "Failed to make a request to the authEndpoint: ERROR. Unable to fetch new key, so dropping encrypted event"
          );
        });
      });
    });
  });
});
