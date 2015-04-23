/* */ 
var util = require("util");
var utils = require("./utils");
var Stream = require("stream");
module.exports = Response;
function Response(req, options) {
  Stream.call(this);
  options = options || {};
  var res = this.res = req.res;
  this.request = req;
  this.req = req.req;
  this.links = {};
  this.text = res.text;
  this.body = res.body !== undefined ? res.body : {};
  this.files = res.files || {};
  this.buffered = 'string' == typeof this.text;
  this.header = this.headers = res.headers;
  this.setStatusProperties(res.statusCode);
  this.setHeaderProperties(this.header);
  this.setEncoding = res.setEncoding.bind(res);
  res.on('data', this.emit.bind(this, 'data'));
  res.on('end', this.emit.bind(this, 'end'));
  res.on('close', this.emit.bind(this, 'close'));
  res.on('error', this.emit.bind(this, 'error'));
}
util.inherits(Response, Stream);
Response.prototype.get = function(field) {
  return this.header[field.toLowerCase()];
};
Response.prototype.destroy = function(err) {
  this.res.destroy(err);
};
Response.prototype.pause = function() {
  this.res.pause();
};
Response.prototype.resume = function() {
  this.res.resume();
};
Response.prototype.toError = function() {
  var req = this.req;
  var method = req.method;
  var path = req.path;
  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.text = this.text;
  err.method = method;
  err.path = path;
  return err;
};
Response.prototype.setHeaderProperties = function(header) {
  var ct = this.header['content-type'] || '';
  var params = utils.params(ct);
  for (var key in params)
    this[key] = params[key];
  this.type = utils.type(ct);
  try {
    if (header.link)
      this.links = utils.parseLinks(header.link);
  } catch (err) {}
};
function parseCookies(header) {
  return Array.isArray(header) ? header.map(Cookie.parse) : [Cookie.parse(header)];
}
Response.prototype.setStatusProperties = function(status) {
  var type = status / 100 | 0;
  this.status = this.statusCode = status;
  this.statusType = type;
  this.info = 1 == type;
  this.ok = 2 == type;
  this.redirect = 3 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type) ? this.toError() : false;
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.forbidden = 403 == status;
  this.notFound = 404 == status;
};
Response.prototype.toJSON = function() {
  return {
    req: this.request.toJSON(),
    header: this.header,
    status: this.status,
    text: this.text
  };
};
