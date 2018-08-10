var Mocks = require("mocks");
var Runtime = require('runtime').default;
var CachedStrategy = require('core/strategies/cached_strategy').default;
var Util = require('core/util').default;

describe("CachedStrategy", function() {
  beforeEach(function() {
    jasmine.Clock.useMock();
  });

  describe("after calling isSupported", function() {
    it("should return true when the substrategy is supported", function() {
      var substrategy = Mocks.getStrategy(true);
      var strategy = new CachedStrategy(substrategy, {}, {});
      expect(strategy.isSupported()).toBe(true);
    });

    it("should return false when the substrategy is not supported", function() {
      var substrategy = Mocks.getStrategy(false);
      var strategy = new CachedStrategy(substrategy, {}, {});
      expect(strategy.isSupported()).toBe(false);
    });
  });

  describe("on browsers not supporting localStorage", function() {
    beforeEach(function() {
      spyOn(Runtime, "getLocalStorage").andReturn(undefined);
    });

    it("should try the substrategy immediately", function() {
      var substrategy = Mocks.getStrategy(false);
      var strategy = new CachedStrategy(substrategy, {}, {});
      var callback = jasmine.createSpy("callback");
      strategy.connect(0, callback);
      expect(substrategy.connect).toHaveBeenCalled();
    });
  });

  describe("on browsers supporting localStorage", function() {
    var localStorage;

    beforeEach(function() {
      localStorage = {};
      spyOn(Runtime, "getLocalStorage").andReturn(localStorage);
    });

    function buildCachedTransportTests(useTLS) {
      var TLS_KEY = "pusherTransportTLS";
      var NON_TLS_KEY = "pusherTransportNonTLS";

      var usedKey = useTLS ? TLS_KEY : NON_TLS_KEY;
      var unusedKey = useTLS ? NON_TLS_KEY : TLS_KEY;

      var substrategy, transports, timeline;
      var strategy;
      var callback;

      beforeEach(function() {
        substrategy = Mocks.getStrategy(true);
        transports = {
          test: Mocks.getStrategy(true)
        };
        timeline = Mocks.getTimeline();

        strategy = new CachedStrategy(substrategy, transports, {
          useTLS: useTLS,
          timeline: timeline
        });
        callback = jasmine.createSpy("callback");
      });

      describe("without cached transport, useTLS=" + useTLS, function() {
        beforeEach(function() {
          delete localStorage[usedKey];
          localStorage[unusedKey] = "mock";
        });

        it("should not report anything to timeline", function() {
          strategy.connect(0, callback);
          expect(timeline.info).not.toHaveBeenCalled();
        });

        it("should try the substrategy immediately when cache is empty", function() {
          strategy.connect(0, callback);
          expect(substrategy.connect).toHaveBeenCalled();
        });

        it("should try the substrategy immediately when cache is stale", function() {
          localStorage[usedKey] = JSON.stringify({
            timestamp: Util.now() - 1801*1000 // default ttl is 1800s
          });

          strategy.connect(0, callback);
          expect(substrategy.connect).toHaveBeenCalled();
        });

        it("should abort the substrategy when requested", function() {
          var runner = strategy.connect(0, callback);
          runner.abort();
          expect(substrategy._abort).toHaveBeenCalled();
        });

        describe("on forceMinPriority", function() {
          it("should force the new priority on the substrategy", function() {
            var runner = strategy.connect(0, callback);
            runner.forceMinPriority(10);
            expect(substrategy._forceMinPriority).toHaveBeenCalledWith(10);
          });
        });

        describe("after connecting successfully", function() {
          var transport;
          var startTimestamp;

          beforeEach(function() {
            startTimestamp = Util.now();
            spyOn(Util, "now").andReturn(startTimestamp);

            strategy.connect(0, callback);
            Util.now.andReturn(startTimestamp + 1000);

            transport = Mocks.getTransport(true);
            transport.name = "test";
            substrategy._callback(null, { transport: transport });
          });

          it("should call back with the transport", function() {
            expect(callback).toHaveBeenCalledWith(null, {
              transport: transport
            });
          });

          it("should cache the connected transport", function() {
            expect(JSON.parse(localStorage[usedKey])).toEqual({
              timestamp: Util.now(),
              transport: "test",
              latency: 1000
            });
            expect(localStorage[unusedKey]).toEqual("mock");
          });
        });

        describe("after receiving an error", function() {
          beforeEach(function() {
            // set a very low timestamp to have something unused in the cache
            localStorage[usedKey] = JSON.stringify({
              timestamp: 0
            });
            strategy.connect(0, callback);
            substrategy._callback(1);
          });

          it("should call back after receiving an error from the substrategy", function() {
            expect(callback).toHaveBeenCalledWith(1);
          });

          it("should flush the appropriate transport cache", function() {
            expect(localStorage.pusherTransport).toBe(undefined);
            expect(localStorage[unusedKey]).toEqual("mock");
          });
        });
      });

      describe("with cached transport, useTLS=" + useTLS, function() {
        var t0 = Util.now();

        beforeEach(function() {
          cachedStrategy = Mocks.getStrategy(true);
          localStorage[usedKey] = JSON.stringify({
            timestamp: t0,
            transport: "test",
            latency: 1000
          });
          localStorage[unusedKey] = "mock";
        });

        it("should try the cached strategy first", function() {
          strategy.connect(0, callback);
          expect(transports.test.connect).toHaveBeenCalled();
        });

        it("should report to timeline when using cached strategy", function() {
          strategy.connect(0, callback);
          expect(timeline.info).toHaveBeenCalledWith({
            cached: true,
            transport: "test",
            latency: 1000
          });
        });

        it("should abort the cached transport and not call the substrategy", function() {
          var runner = strategy.connect(0, callback);
          runner.abort();
          expect(transports.test._abort).toHaveBeenCalled();
          expect(substrategy.connect).not.toHaveBeenCalled();
        });

        describe("on forceMinPriority", function() {
          it("should force the new priority on the cached strategy", function() {
            var runner = strategy.connect(0, callback);
            runner.forceMinPriority(1000);
            expect(transports.test._forceMinPriority).toHaveBeenCalledWith(1000);
          });
        });

        describe("after connecting successfully with the cached transport", function() {
          var transport;

          beforeEach(function() {
            startTimestamp = Util.now();
            spyOn(Util, "now").andReturn(startTimestamp);

            strategy.connect(0, callback);
            Util.now.andReturn(startTimestamp + 2000);

            transport = Mocks.getTransport(true);
            transport.name = "test";
            transport.options = { useTLS: false };
            transports.test._callback(null, { transport: transport });
          });

          it("should call back with the transport", function() {
            expect(callback).toHaveBeenCalledWith(null, { transport: transport });
          });

          it("should not try the substrategy", function() {
            expect(substrategy.connect).not.toHaveBeenCalled();
          });

          it("should cache the connected transport", function() {
            expect(JSON.parse(localStorage[usedKey])).toEqual({
              timestamp: Util.now(),
              transport: "test",
              latency: 2000
            });
            expect(localStorage[unusedKey]).toEqual("mock");
          });
        });

        describe("after double the cached latency + 1s", function() {
          beforeEach(function() {
            startTimestamp = Util.now();
            spyOn(Util, "now").andReturn(startTimestamp);

            strategy.connect(0, callback);

            Util.now.andReturn(startTimestamp + 3000);
            jasmine.Clock.tick(3000);
          });

          it("should abort the cached strategy", function() {
            expect(transports.test._abort).toHaveBeenCalled();
          });

          it("should fall back to the substrategy", function() {
            expect(substrategy.connect).toHaveBeenCalled();
          });

          it("should flush the appropriate transport cache", function() {
            expect(localStorage[usedKey]).toBe(undefined);
            expect(localStorage[unusedKey]).toEqual("mock");
          });
        });

        describe("after failing to connect with the cached transport", function() {
          var runner;

          beforeEach(function() {
            startTimestamp = Util.now();
            spyOn(Util, "now").andReturn(startTimestamp);

            runner = strategy.connect(0, callback);
            runner.forceMinPriority(666);
            Util.now.andReturn(startTimestamp + 2000);
            transports.test._callback("error");
            Util.now.andReturn(startTimestamp + 2500);
          });

          it("should fall back to the substrategy", function() {
            expect(substrategy.connect).toHaveBeenCalled();
          });

          it("should flush the appropriate transport cache", function() {
            expect(localStorage[usedKey]).toBe(undefined);
            expect(localStorage[unusedKey]).toEqual("mock");
          });

          it("should abort the substrategy when requested", function() {
            runner.abort();
            expect(cachedStrategy._abort).not.toHaveBeenCalled();
            expect(substrategy._abort).toHaveBeenCalled();
          });

          describe("on forceMinPriority", function() {
            it("should force the previously set priority on the substrategy", function() {
              // priority is forced in beforeEach
              expect(substrategy.connect)
                .toHaveBeenCalledWith(666, jasmine.any(Function));
            });

            it("should force the new priority on the substrategy", function() {
              runner.forceMinPriority(3);
              expect(substrategy._forceMinPriority).toHaveBeenCalledWith(3);
            });
          });

          describe("and connecting successfully using the substrategy", function() {
            var transport;

            beforeEach(function() {
              transport = Mocks.getTransport(true);
              transport.name = "test";
              substrategy._callback(null, { transport: transport });
            });

            it("should call back with the connection", function() {
              expect(callback).toHaveBeenCalledWith(null, {
                transport: transport
              });
            });

            it("should cache the connected transport", function() {
              expect(JSON.parse(localStorage[usedKey])).toEqual({
                timestamp: Util.now(),
                transport: "test",
                latency: 500
              });
              expect(localStorage[unusedKey]).toEqual("mock");
            });
          });

          describe("and failing to connect using the substrategy", function() {
            beforeEach(function() {
              substrategy._callback("error again");
            });

            it("should call back with the error", function() {
              expect(callback).toHaveBeenCalledWith("error again");
            });

            it("should flush the appropriate transport cache", function() {
              expect(localStorage[usedKey]).toBe(undefined);
              expect(localStorage[unusedKey]).toEqual("mock");
            });
          });
        });
      });
    }

    buildCachedTransportTests(false);
    buildCachedTransportTests(true);
  });
});
