var config = {
  browserStack: {
    startTunnel: true,
    timeout: 1800,
  },
  browsers: ['ChromeHeadless', 'FirefoxHeadless'],
  customLaunchers: {
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
