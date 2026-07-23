var collections = require('core/utils/collections');

describe("collections", function() {
  describe("extend", function() {
    it("should merge plain properties into the target", function() {
      var target = collections.extend({}, { foo: "bar" }, { baz: 42 });
      expect(target).toEqual({ foo: "bar", baz: 42 });
    });

    it("should deep-merge nested plain objects", function() {
      var target = collections.extend({}, { nested: { a: 1 } }, { nested: { b: 2 } });
      expect(target).toEqual({ nested: { a: 1, b: 2 } });
    });

    it("should not copy a __proto__ property onto the target or Object.prototype", function() {
      var payload = JSON.parse('{"__proto__": {"polluted": true}}');
      var target = collections.extend({}, payload);
      expect(target.polluted).toBeUndefined();
      expect(({}).polluted).toBeUndefined();
    });

    it("should not copy a constructor or prototype property onto the target", function() {
      var target = collections.extend({}, { constructor: "evil", prototype: "evil" });
      expect(target.constructor).toBe(Object);
      expect(target.prototype).toBeUndefined();
    });
  });

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

    it("should serialize null values as empty strings and not as the string 'null'", function() {
      var query = collections.buildQueryString({ foo: "bar", register_id: null });
      expect(query).toContain("register_id=");
      expect(query).not.toContain("null");
    });

    it("should omit undefined values but keep null keys with empty values", function() {
      var query = collections.buildQueryString({ a: null, b: undefined });
      expect(query).toContain("a=");
      expect(query).not.toContain("b");
    });
  });
});
