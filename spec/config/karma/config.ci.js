var config = {
  browsers: ['ChromeHeadlessNoHttpsUpgrade', 'FirefoxHeadlessNoHttpsUpgrade'],
  customLaunchers: {
    // When forceTLS=true XHR tests run first, browsers store an HSTS entry for
    // sockjs-*.pusher.com (Pusher servers send Strict-Transport-Security headers).
    // Subsequent forceTLS=false XHR tests request HTTP URLs which are then
    // silently upgraded to HTTPS via HSTS. The resulting CORS preflight for the
    // upgraded URL fails, blocking the connection. Disabling web security (Chrome)
    // or HTTPS-only mode (Firefox) bypasses this so the HSTS-upgraded HTTPS
    // response is returned to the Pusher client and the connection can establish.
    ChromeHeadlessNoHttpsUpgrade: {
      base: 'ChromeHeadless',
      flags: ['--disable-web-security']
    },
    FirefoxHeadlessNoHttpsUpgrade: {
      base: 'FirefoxHeadless',
      prefs: {
        'dom.security.https_only_mode': false,
        'network.stricttransportsecurity.preloadlist': false
      }
    }
  }
};

module.exports = config;
