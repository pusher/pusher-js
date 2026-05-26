describe('CJS build SSR import', function () {
  it('should import pusher-js/cjs without crashing in a non-browser environment', function () {
    expect(typeof window).toBe('undefined');
    expect(function () {
      require('../../../../cjs');
    }).not.toThrow();
  });

  it('should import pusher-js/cjs/with-encryption without crashing in a non-browser environment', function () {
    expect(typeof window).toBe('undefined');
    expect(function () {
      require('../../../../cjs/with-encryption');
    }).not.toThrow();
  });
});
