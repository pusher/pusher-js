var config = {
  browserStack: {
    startTunnel: true,
    timeout: 1800,
  },
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
    },
    bs_safari_12: {
      base: 'BrowserStack',
      os_version: "Mojave",
      browser: "Safari",
      browser_version: "12",
      os: "OS X"
    }
  }
};
if (process.env.CI === 'full' && browserStackCredsAvailable()) {
  config.browsers.push('bs_safari_12');
}

function browserStackCredsAvailable() {
  return process.env.BROWSER_STACK_USERNAME && process.env.BROWSER_STACK_ACCESS_KEY
}

module.exports = config;
