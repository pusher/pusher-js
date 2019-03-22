var config = {
  browserStack: {
    startTunnel: true,
    timeout: 1800
  },
  customLaunchers: {
    bs_chrome_73: {
      base: 'BrowserStack',
      os_version: "Mojave",
      browser: "Chrome",
      browser_version: "73.0",
      os: "OS X"
    }
  }
};

if (process.env.CI === 'full') {
  config.browsers = Object.keys(config.customLaunchers);
} else {
  config.browsers = ['bs_chrome_73'];
}

module.exports = config;
