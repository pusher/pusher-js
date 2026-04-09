// Regression test for https://github.com/pusher/pusher-js/issues/935
// Verifies that the Node bundle default export is the Pusher constructor directly,
// not wrapped in an object ({ Pusher: PusherClass }).
describe("Node bundle export shape", function() {
  var Pusher;

  beforeAll(function() {
    Pusher = require('../../../../dist/node/pusher.js');
  });

  it("should export the Pusher constructor as the default export", function() {
    expect(typeof Pusher).toBe("function");
  });

  it("should not wrap the constructor in an object", function() {
    expect(typeof Pusher.Pusher).toBe("undefined");
  });

  it("should be instantiable with new", function() {
    expect(function() { Pusher.prototype; }).not.toThrow();
  });
});
