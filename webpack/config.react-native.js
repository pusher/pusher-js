var path = require("path");

module.exports = {
  entry: "./src/pusher",
  output: {
    library: "Pusher",
    path: path.join(__dirname, "../bundle/react-native"),
    filename: "pusher.js"
  }
}