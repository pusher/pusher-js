var collections = require('core/utils/collections');

describe("collections", function() {
  describe("buildQueryString", function() {
    it("should include defined string and number values", function() {
      var query = collections.buildQueryString({ foo: "bar", baz: 42 });
      expect(query).toContain("foo=");
      expect(query).toContain("baz=");
    });

    it("should omit undefined values", function() {
      var query = collections.buildQueryString({ foo: "bar", missing: undefined });
      expect(query).not.toContain("missing");
    });

    it("should omit null values and not serialize them as the string 'null'", function() {
      var query = collections.buildQueryString({ foo: "bar", register_id: null });
      expect(query).not.toContain("register_id");
      expect(query).not.toContain("null");
    });

    it("should omit all null values when the entire params object contains nulls", function() {
      var query = collections.buildQueryString({ a: null, b: null });
      expect(query).toEqual("");
    });
  });
});
