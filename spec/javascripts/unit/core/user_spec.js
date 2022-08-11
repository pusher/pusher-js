var TestEnv = require("testenv");
var Util = require("core/util").default;
var Collections = require("core/utils/collections");
var Logger = require("core/logger").default;
var Defaults = require("core/defaults").default;
var DefaultConfig = require("core/config");
var TimelineSender = require("core/timeline/timeline_sender").default;
var Pusher = require("core/pusher").default;
var Mocks = require("../../helpers/mocks");
var Factory = require("core/utils/factory").default;
var Runtime = require("runtime").default;
const transports = Runtime.Transports;
const Network = require("net_info").Network;
const waitsFor = require("../../helpers/waitsFor");
var NetInfo = require("net_info").NetInfo;

describe("Pusher (User)", function () {

  describe("#signin", function () {
    var pusher;
    beforeEach(function () {
      pusher = new Pusher("foo");
      spyOn(pusher.config, "userAuthenticator");
      spyOn(pusher, "send_event");
      pusher.connection.state = "connected";
      pusher.connection.socket_id = "1.23";
    });

    it("should not call userAuthenticator if the connection is not connected", function () {
      pusher.connection.state = "connecting";
      pusher.signin();
      expect(pusher.config.userAuthenticator).not.toHaveBeenCalled();
    });


    it("should fail if userAuthenticator fails", function () {
      pusher.config.userAuthenticator.and.callFake(function (params, callback) {
        callback("this error", {});
      });
      spyOn(Logger, "warn");
      pusher.signin();
      expect(pusher.config.userAuthenticator).toHaveBeenCalledWith(
        { socketId: "1.23" },
        jasmine.any(Function)
      );
      expect(Logger.warn).toHaveBeenCalledWith(
        "Error during signin: this error"
      );
    });

    it("should send pusher:signin event", function () {
      pusher.config.userAuthenticator.and.callFake(function (params, callback) {
        callback(null, {
          auth: "auth",
          user_data: JSON.stringify({ id: "1" }),
          foo: "bar"
        });
      });
      spyOn(Logger, "warn");
      pusher.signin();
      expect(pusher.config.userAuthenticator).toHaveBeenCalledWith(
        { socketId: "1.23" },
        jasmine.any(Function)
      );
      expect(pusher.send_event).toHaveBeenCalledWith("pusher:signin", {
        auth: "auth",
        user_data: JSON.stringify({ id: "1" })
      });
    });

    it("should signin when the connection becomes connected", function () {
      pusher.connection.state = "connecting";
      pusher.signin();
      expect(pusher.config.userAuthenticator).not.toHaveBeenCalled();

      pusher.config.userAuthenticator.and.callFake(function (params, callback) {
        callback(null, {
          auth: "auth",
          user_data: JSON.stringify({ id: "1" }),
          foo: "bar"
        });
      });

      pusher.connection.state = "connected";
      pusher.connection.emit('state_change', {previous:'connecting', current:'connected'});

      expect(pusher.config.userAuthenticator).toHaveBeenCalledWith(
        { socketId: "1.23" },
        jasmine.any(Function)
      );
      expect(pusher.send_event).toHaveBeenCalledWith("pusher:signin", {
        auth: "auth",
        user_data: JSON.stringify({ id: "1" })
      });
    });

    it("should re-signin when the connection reconnects!", function () {
      pusher.config.userAuthenticator.and.callFake(function (params, callback) {
        callback(null, {
          auth: "auth",
          user_data: JSON.stringify({ id: "1" }),
          foo: "bar"
        });
      });

      pusher.signin();
      expect(pusher.config.userAuthenticator).toHaveBeenCalledWith(
        { socketId: "1.23" },
        jasmine.any(Function)
      );
      expect(pusher.send_event).toHaveBeenCalledWith("pusher:signin", {
        auth: "auth",
        user_data: JSON.stringify({ id: "1" })
      });
      pusher.send_event.calls.reset()
      pusher.config.userAuthenticator.calls.reset()

      pusher.connection.state == "disconnected";
      pusher.connection.emit('state_change', {previous:'connected', current:'disconnected'});
      pusher.connection.state == "connecting";
      pusher.connection.emit('state_change', {previous:'disconnected', current:'connecting'});
      pusher.connection.state == "connected";
      pusher.connection.emit('state_change', {previous:'connecting', current:'connected'});

      expect(pusher.config.userAuthenticator).toHaveBeenCalledWith(
        { socketId: "1.23" },
        jasmine.any(Function)
      );
      expect(pusher.send_event).toHaveBeenCalledWith("pusher:signin", {
        auth: "auth",
        user_data: JSON.stringify({ id: "1" })
      });
    });

    it("should not signin when the connection is connected if signin() was never called", function () {
      pusher.connection.state = "connected";
      pusher.connection.emit('state_change', {previous:'connecting', current:'connected'});
      expect(pusher.config.userAuthenticator).not.toHaveBeenCalled();
    })

  });


  describe('pusher:signin_success', function () {
    var pusher;
    var transport;

    beforeEach(async function () {
      spyOn(Network, 'isOnline').and.returnValue(true);
      spyOn(Runtime, 'getLocalStorage').and.returnValue({});

      var Transports = Runtime.Transports;
      function createConnection() {
        transport = Mocks.getWorkingTransport();
        return transport;
      }
      spyOn(Transports.xhr_polling, 'createConnection').and.callFake(
        createConnection
      );
      spyOn(Transports.xhr_polling, 'isSupported').and.returnValue(true);
      pusher = new Pusher('foobar', {
        enabledTransports: ['xhr_polling']
      });
      pusher.connect();
      await waitsFor(
        function () {
          return pusher.connection.state === 'connected';
        },
        'pusher.connection.state to be connected',
        500
      );
    });

    it('should process pusher:signin_success', async function () {
      pusher.user._signinDoneResolve = jasmine.createSpy('signinDoneResolve');
      transport.emit('message', {
        data: JSON.stringify({
          event: 'pusher:signin_success',
          data: {
            user_data: JSON.stringify({ id: '1', name: 'test' })
          }
        })
      });

      expect(pusher.user.user_data).toEqual({ id: '1', name: 'test' });
      expect(pusher.user.serverToUserChannel.subscriptionPending).toBe(true);
      expect(pusher.user._signinDoneResolve).toHaveBeenCalled();
    });

    it('should log warning if user_data is not JSON', async function () {
      spyOn(Logger, 'error');
      transport.emit('message', {
        data: JSON.stringify({
          event: 'pusher:signin_success',
          data: {
            user_data: "I'm not JSON"
          }
        })
      });
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed parsing user data after signin: I'm not JSON"
      );
      expect(pusher.user.user_data).toEqual(null);
    });

    it('should bind to servetToUser channel events after sign in', async function () {
      const fooCallback = jasmine.createSpy('fooCallback');
      const barCallback = jasmine.createSpy('barCallback');
      pusher.user.bind('foo', fooCallback);
      pusher.user.bind('bar', barCallback);

      // Send events on channel without being signed in
      transport.emit('message', {
        data: JSON.stringify({
          channel: '#server-to-user-1',
          event: 'foo',
          data: { 'something': 'another' }
        })
      });

      expect(fooCallback).not.toHaveBeenCalled();
      expect(barCallback).not.toHaveBeenCalled();

      // Sign in successfully
      pusher.user._signinDoneResolve = jasmine.createSpy('signinDoneResolve');
      transport.emit('message', {
        data: JSON.stringify({
          event: 'pusher:signin_success',
          data: {
            user_data: JSON.stringify({ id: '1', name: 'test' })
          }
        })
      });
      transport.emit('message', {
        data: JSON.stringify({
          channel: '#server-to-user-1',
          event: 'pusher_internal:subscription_succeeded',
          data: {}
        })
      });
      await waitsFor(
        function () {
          return pusher.user.serverToUserChannel.subscribed === true;
        },
        'pusher.user.serverToUserChannel.subscribed to be true',
        500
      );
      expect(pusher.user._signinDoneResolve).toHaveBeenCalled();

      // Send events on channel
      transport.emit('message', {
        data: JSON.stringify({
          channel: '#server-to-user-1',
          event: 'foo',
          data: { 'something': 'another' }
        })
      });

      expect(fooCallback).toHaveBeenCalledWith({ 'something': 'another' });
      expect(barCallback).not.toHaveBeenCalled();
    });


    it('should cleanup the signed in state when disconnected', async function () {
      // Sign in successfully
      pusher.user._signinDoneResolve = jasmine.createSpy('signinDoneResolve');
      transport.emit('message', {
        data: JSON.stringify({
          event: 'pusher:signin_success',
          data: {
            user_data: JSON.stringify({ id: '1', name: 'test' })
          }
        })
      });
      transport.emit('message', {
        data: JSON.stringify({
          channel: '#server-to-user-1',
          event: 'pusher_internal:subscription_succeeded',
          data: {}
        })
      });
      await waitsFor(
        function () {
          return pusher.user.serverToUserChannel.subscribed === true;
        },
        'pusher.user.serverToUserChannel.subscribed to be true',
        500
      );
      expect(pusher.user._signinDoneResolve).toHaveBeenCalled();

      expect(pusher.user.user_data).toEqual({ id: '1', name: 'test' });
      expect(pusher.user.serverToUserChannel.subscribed).toBe(true);

      // Disconnect
      pusher.connection.emit('state_change', {previous:'connected', current:'disconnected'});

      expect(pusher.user.user_data).toEqual(null);
      expect(pusher.user.serverToUserChannel).toEqual(null);
    });
  });

});
