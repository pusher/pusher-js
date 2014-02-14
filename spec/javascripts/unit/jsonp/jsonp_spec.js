describe("JSONP", function() {
  it("should use a '_pusher_jsonp_' prefix", function() {
    expect(Pusher.JSONP.prefix).toEqual("_pusher_jsonp_");
  });

  it("should use a 'Pusher.JSONP' name", function() {
    expect(Pusher.JSONP.name).toEqual("Pusher.JSONP");
  });
});
