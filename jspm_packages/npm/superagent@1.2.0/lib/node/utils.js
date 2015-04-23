/* */ 
(function(Buffer) {
  var StringDecoder = require("string_decoder").StringDecoder;
  var Stream = require("stream");
  var zlib;
  try {
    zlib = require("zlib");
  } catch (e) {}
  exports.type = function(str) {
    return str.split(/ *; */).shift();
  };
  exports.params = function(str) {
    return str.split(/ *; */).reduce(function(obj, str) {
      var parts = str.split(/ *= */);
      var key = parts.shift();
      var val = parts.shift();
      if (key && val)
        obj[key] = val;
      return obj;
    }, {});
  };
  exports.parseLinks = function(str) {
    return str.split(/ *, */).reduce(function(obj, str) {
      var parts = str.split(/ *; */);
      var url = parts[0].slice(1, -1);
      var rel = parts[1].split(/ *= */)[1].slice(1, -1);
      obj[rel] = url;
      return obj;
    }, {});
  };
  exports.unzip = function(req, res) {
    if (!zlib)
      return ;
    var unzip = zlib.createUnzip();
    var stream = new Stream;
    var decoder;
    stream.req = req;
    unzip.on('error', function(err) {
      stream.emit('error', err);
    });
    res.pipe(unzip);
    res.setEncoding = function(type) {
      decoder = new StringDecoder(type);
    };
    unzip.on('data', function(buf) {
      if (decoder) {
        var str = decoder.write(buf);
        if (str.length)
          stream.emit('data', str);
      } else {
        stream.emit('data', buf);
      }
    });
    unzip.on('end', function() {
      stream.emit('end');
    });
    var _on = res.on;
    res.on = function(type, fn) {
      if ('data' == type || 'end' == type) {
        stream.on(type, fn);
      } else if ('error' == type) {
        stream.on(type, fn);
        _on.call(res, type, fn);
      } else {
        _on.call(res, type, fn);
      }
    };
  };
  exports.cleanHeader = function(header) {
    delete header['content-type'];
    delete header['content-length'];
    delete header['transfer-encoding'];
    delete header['cookie'];
    delete header['host'];
    return header;
  };
})(require("buffer").Buffer);
