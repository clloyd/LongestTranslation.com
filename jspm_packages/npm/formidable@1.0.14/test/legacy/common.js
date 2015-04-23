/* */ 
(function(process) {
  var path = require("path"),
      fs = require("fs");
  try {
    global.Gently = require("gently");
  } catch (e) {
    throw new Error('this test suite requires node-gently');
  }
  exports.lib = path.join(__dirname, '../../lib');
  global.GENTLY = new Gently();
  global.assert = require("assert");
  global.TEST_PORT = 13532;
  global.TEST_FIXTURES = path.join(__dirname, '../fixture');
  global.TEST_TMP = path.join(__dirname, '../tmp');
  if (process.setMaxListeners) {
    process.setMaxListeners(10000);
  }
})(require("process"));
