var path = require("path");

module.exports = function pathToSource(_path){
  return path.join(__dirname, "../src", _path);
}
