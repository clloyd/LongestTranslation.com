var assert = require('chai').assert;

describe('Server.js', function() {

  var startServer = function() {
    var server = require('../server.js');
  };

  it('should give error if no YANDEX_KEY is provided', function() {
    assert.throw(startServer);
  });

  it('should start correctly if YANDEX_KEY is set', function() {
    process.env.YANDEX_KEY = 'test_key'; //manually set process.env.YANDEX_KEY
    assert.doesNotThrow(startServer);
  });
});
