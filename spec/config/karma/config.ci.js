var config;
if (process.env.CI === 'full') {
  config = getBrowserStackConfig();
  config.browsers = Object.keys(config.customLaunchers);
} else {
  config = {
    browsers: ['ChromeHeadless']
  };
}

function getBrowserStackConfig() {
  return {
    browserStack: {
      startTunnel: true,
      timeout: 1800
    },
    customLaunchers: {
      bs_chrome_74: {
        base: 'BrowserStack',
        os_version: "Mojave",
        browser: "Chrome",
        browser_version: "74.0",
        os: "OS X"
      },
      bs_firefox_66: {
        base: 'BrowserStack',
        os_version: "Mojave",
        browser: "Firefox",
        browser_version: "66.0",
        os: "OS X"
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
}

module.exports = config;
