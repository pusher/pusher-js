var config = {
  browserStack: {
    startTunnel: true
  },
  customLaunchers: {
    bs_ie8: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '8.0',
      os: "Windows",
      os_version: '7'
    },
    bs_ie7: {
      base: 'BrowserStack',
      os_version: "XP",
      browser: "ie",
      browser_version: "7.0",
      os: "Windows"
    },
    bs_opera_12_15: {
      base: 'BrowserStack',
      os_version: "8",
      browser: "opera",
      browser_version: "12.15",
      os: "Windows"
    },
    bs_firefox_3_6: {
      base: 'BrowserStack',
      os_version: "7",
      browser: "firefox",
      browser_version: "3.6",
      device: null,
      os: "Windows"
    }
  },
  browsers: [
    'bs_ie8'
    // ,
    // 'bs_ie7'
    // 'bs_opera1215'
    // 'bs_firefox_3_6'
  ]
};

module.exports = config;
