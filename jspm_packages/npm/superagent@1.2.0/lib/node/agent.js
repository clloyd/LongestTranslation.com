/* */ 
var CookieJar = require("cookiejar").CookieJar;
var CookieAccess = require("cookiejar").CookieAccessInfo;
var parse = require("url").parse;
var request = require("../client");
var methods = require("methods");
module.exports = Agent;
function Agent(options) {
  if (!(this instanceof Agent))
    return new Agent(options);
  if (options)
    this._ca = options.ca;
  this.jar = new CookieJar;
}
Agent.prototype.saveCookies = function(res) {
  var cookies = res.headers['set-cookie'];
  if (cookies)
    this.jar.setCookies(cookies);
};
Agent.prototype.attachCookies = function(req) {
  var url = parse(req.url);
  var access = CookieAccess(url.hostname, url.pathname, 'https:' == url.protocol);
  var cookies = this.jar.getCookies(access).toValueString();
  req.cookies = cookies;
};
methods.forEach(function(method) {
  var name = 'delete' == method ? 'del' : method;
  method = method.toUpperCase();
  Agent.prototype[name] = function(url, fn) {
    var req = request(method, url);
    req.ca(this._ca);
    req.on('response', this.saveCookies.bind(this));
    req.on('redirect', this.saveCookies.bind(this));
    req.on('redirect', this.attachCookies.bind(this, req));
    this.attachCookies(req);
    fn && req.end(fn);
    return req;
  };
});
