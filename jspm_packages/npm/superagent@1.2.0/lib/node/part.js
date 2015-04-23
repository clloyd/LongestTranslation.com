/* */ 
(function(Buffer) {
  var util = require("util");
  var mime = require("mime");
  var FormData = require("form-data");
  var PassThrough = require("readable-stream/passthrough");
  var Part = function(req) {
    PassThrough.call(this);
    this._req = req;
    this._attached = false;
    this._name = null;
    this._type = null;
    this._header = null;
    this._filename = null;
    this.once('pipe', this._attach.bind(this));
  };
  Part = util.deprecate(Part, 'The `Part()` constructor is deprecated. ' + 'Pass a readable stream in to `Request#attach()` instead.');
  util.inherits(Part, PassThrough);
  module.exports = Part;
  Part.prototype.set = function(field, val) {
    throw new TypeError('setting custom form-data part headers is unsupported');
  };
  Part.prototype.type = function(type) {
    var lookup = mime.lookup(type);
    this._type = lookup;
    return this;
  };
  Part.prototype.name = function(name) {
    this._name = name;
    return this;
  };
  Part.prototype.attachment = function(name, filename) {
    this.name(name);
    if (filename) {
      this.type(filename);
      this._filename = filename;
    }
    return this;
  };
  Part.prototype._attach = function() {
    if (this._attached)
      return ;
    this._attached = true;
    if (!this._name)
      throw new Error('must call `Part#name()` first!');
    if (!this._req._formData)
      this._req._formData = new FormData();
    this._req._formData.append(this._name, this, {
      contentType: this._type,
      filename: this._filename
    });
    this.write = PassThrough.prototype.write;
  };
  Part.prototype.write = function() {
    this._attach();
    return this.write.apply(this, arguments);
  };
})(require("buffer").Buffer);
