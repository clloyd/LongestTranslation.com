/* */ 
(function(Buffer) {
  module.exports = function(res, fn) {
    var data = [];
    res.on('data', function(chunk) {
      data.push(chunk);
    });
    res.on('end', function() {
      fn(null, Buffer.concat(data));
    });
  };
})(require("buffer").Buffer);
