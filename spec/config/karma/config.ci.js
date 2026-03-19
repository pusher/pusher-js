var config = {
  browsers: ['ChromeHeadlessNoHttpsUpgrade', 'FirefoxHeadless'],
  customLaunchers: {
    // When forceTLS=true XHR tests run first, Chrome stores an HSTS entry for
    // sockjs-*.pusher.com (Pusher servers send Strict-Transport-Security headers).
    // Subsequent forceTLS=false XHR tests request HTTP URLs which Chrome then
    // upgrades to HTTPS via HSTS. Chrome's CORS preflight for the upgraded URL
    // fails with kPreflightInvalidStatus (ERR_FAILED), silently blocking the
    // connection. Firefox handles this case correctly. Disabling web security
    // bypasses the CORS check so the HSTS-upgraded HTTPS response is returned
    // to the Pusher client and the connection can establish.
    ChromeHeadlessNoHttpsUpgrade: {
      base: 'ChromeHeadless',
      flags: ['--disable-web-security']
    }
  }
};

module.exports = config;
