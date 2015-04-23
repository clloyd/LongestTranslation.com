/* */ 
(function(Buffer) {
  var debug = require("debug")('superagent');
  var formidable = require("formidable");
  var FormData = require("form-data");
  var Response = require("./response");
  var parse = require("url").parse;
  var format = require("url").format;
  var resolve = require("url").resolve;
  var methods = require("methods");
  var Stream = require("stream");
  var utils = require("./utils");
  var extend = require("extend");
  var Part = require("./part");
  var mime = require("mime");
  var https = require("https");
  var http = require("http");
  var fs = require("fs");
  var qs = require("qs");
  var zlib = require("zlib");
  var util = require("util");
  var pkg = require("../../package.json!systemjs-json");
  exports = module.exports = request;
  exports.agent = require("./agent");
  exports.Part = Part;
  function noop() {}
  ;
  exports.Response = Response;
  mime.define({'application/x-www-form-urlencoded': ['form', 'urlencoded', 'form-data']});
  exports.protocols = {
    'http:': http,
    'https:': https
  };
  function isObject(obj) {
    return null != obj && 'object' == typeof obj;
  }
  exports.serialize = {
    'application/x-www-form-urlencoded': qs.stringify,
    'application/json': JSON.stringify
  };
  exports.parse = require("./parsers/index");
  function Request(method, url) {
    Stream.call(this);
    var self = this;
    if ('string' != typeof url)
      url = format(url);
    this._agent = false;
    this._formData = null;
    this.method = method;
    this.url = url;
    this.header = {};
    this.writable = true;
    this._redirects = 0;
    this.redirects(5);
    this.cookies = '';
    this.qs = {};
    this.qsRaw = [];
    this._redirectList = [];
    this.on('end', this.clearTimeout.bind(this));
  }
  util.inherits(Request, Stream);
  Request.prototype.field = function(name, val) {
    debug('field', name, val);
    if (!this._formData)
      this._formData = new FormData();
    this._formData.append(name, val);
    return this;
  };
  Request.prototype.attach = function(field, file, filename) {
    if (!this._formData)
      this._formData = new FormData();
    if ('string' == typeof file) {
      if (!filename)
        filename = file;
      debug('creating `fs.ReadStream` instance for file: %s', file);
      file = fs.createReadStream(file);
    }
    this._formData.append(field, file, {filename: filename});
    return this;
  };
  Request.prototype.redirects = function(n) {
    debug('max redirects %s', n);
    this._maxRedirects = n;
    return this;
  };
  Request.prototype.part = util.deprecate(function() {
    return new Part(this);
  }, '`Request#part()` is deprecated. ' + 'Pass a readable stream in to `Request#attach()` instead.');
  Request.prototype.agent = function(agent) {
    if (!arguments.length)
      return this._agent;
    this._agent = agent;
    return this;
  };
  Request.prototype.set = function(field, val) {
    if (isObject(field)) {
      for (var key in field) {
        this.set(key, field[key]);
      }
      return this;
    }
    debug('set %s "%s"', field, val);
    this.request().setHeader(field, val);
    return this;
  };
  Request.prototype.unset = function(field) {
    debug('unset %s', field);
    this.request().removeHeader(field);
    return this;
  };
  Request.prototype.get = function(field) {
    return this.request().getHeader(field);
  };
  Request.prototype.type = function(type) {
    return this.set('Content-Type', ~type.indexOf('/') ? type : mime.lookup(type));
  };
  Request.prototype.accept = function(type) {
    return this.set('Accept', ~type.indexOf('/') ? type : mime.lookup(type));
  };
  Request.prototype.query = function(val) {
    if ('string' == typeof val) {
      this.qsRaw.push(val);
      return this;
    }
    extend(this.qs, val);
    return this;
  };
  Request.prototype.send = function(data) {
    var obj = isObject(data);
    var req = this.request();
    var type = req.getHeader('Content-Type');
    if (obj && isObject(this._data)) {
      for (var key in data) {
        this._data[key] = data[key];
      }
    } else if ('string' == typeof data) {
      if (!type)
        this.type('form');
      type = req.getHeader('Content-Type');
      if ('application/x-www-form-urlencoded' == type) {
        this._data = this._data ? this._data + '&' + data : data;
      } else {
        this._data = (this._data || '') + data;
      }
    } else {
      this._data = data;
    }
    if (!obj)
      return this;
    if (!type)
      this.type('json');
    return this;
  };
  Request.prototype.write = function(data, encoding) {
    return this.request().write(data, encoding);
  };
  Request.prototype.pipe = function(stream, options) {
    this.piped = true;
    this.buffer(false);
    var self = this;
    this.end().req.on('response', function(res) {
      var redirect = isRedirect(res.statusCode);
      if (redirect && self._redirects++ != self._maxRedirects) {
        return self.redirect(res).pipe(stream, options);
      }
      if (/^(deflate|gzip)$/.test(res.headers['content-encoding'])) {
        res.pipe(zlib.createUnzip()).pipe(stream, options);
      } else {
        res.pipe(stream, options);
      }
      res.on('end', function() {
        self.emit('end');
      });
    });
    return stream;
  };
  Request.prototype.buffer = function(val) {
    this._buffer = false === val ? false : true;
    return this;
  };
  Request.prototype.timeout = function(ms) {
    this._timeout = ms;
    return this;
  };
  Request.prototype.clearTimeout = function() {
    debug('clear timeout %s %s', this.method, this.url);
    this._timeout = 0;
    clearTimeout(this._timer);
    return this;
  };
  Request.prototype.abort = function() {
    debug('abort %s %s', this.method, this.url);
    this._aborted = true;
    this.clearTimeout();
    this.req.abort();
    this.emit('abort');
  };
  Request.prototype.parse = function(fn) {
    this._parser = fn;
    return this;
  };
  Request.prototype.redirect = function(res) {
    var url = res.headers.location;
    if (!url) {
      return this.callback(new Error('No location header for redirect'), res);
    }
    debug('redirect %s -> %s', this.url, url);
    url = resolve(this.url, url);
    res.resume();
    var headers = this.req._headers;
    if (res.statusCode == 301 || res.statusCode == 302) {
      headers = utils.cleanHeader(this.req._headers);
      this.method = 'HEAD' == this.method ? 'HEAD' : 'GET';
      this._data = null;
    }
    if (res.statusCode == 303) {
      headers = utils.cleanHeader(this.req._headers);
      this.method = 'GET';
      this._data = null;
    }
    delete headers.host;
    delete this.req;
    this.url = url;
    this._redirectList.push(url);
    this.emit('redirect', res);
    this.qs = {};
    this.set(headers);
    this.end(this._callback);
    return this;
  };
  Request.prototype.auth = function(user, pass) {
    if (1 === arguments.length)
      pass = '';
    if (!~user.indexOf(':'))
      user = user + ':';
    var str = new Buffer(user + pass).toString('base64');
    return this.set('Authorization', 'Basic ' + str);
  };
  Request.prototype.ca = function(cert) {
    this._ca = cert;
    return this;
  };
  Request.prototype.use = function(fn) {
    fn(this);
    return this;
  };
  Request.prototype.request = function() {
    if (this.req)
      return this.req;
    var self = this;
    var options = {};
    var data = this._data;
    var url = this.url;
    if (0 != url.indexOf('http'))
      url = 'http://' + url;
    url = parse(url, true);
    options.method = this.method;
    options.port = url.port;
    options.path = url.pathname;
    options.host = url.hostname;
    options.ca = this._ca;
    options.agent = this._agent;
    var mod = exports.protocols[url.protocol];
    var req = this.req = mod.request(options);
    if ('HEAD' != options.method)
      req.setHeader('Accept-Encoding', 'gzip, deflate');
    this.protocol = url.protocol;
    this.host = url.host;
    req.on('drain', function() {
      self.emit('drain');
    });
    req.on('error', function(err) {
      if (self._aborted)
        return ;
      self.callback(err);
    });
    if (url.auth) {
      var auth = url.auth.split(':');
      this.auth(auth[0], auth[1]);
    }
    this.query(url.query);
    if (this.cookies)
      req.setHeader('Cookie', this.cookies);
    req.setHeader('User-Agent', 'node-superagent/' + pkg.version);
    return req;
  };
  Request.prototype.callback = function(err, res) {
    var fn = this._callback;
    this.clearTimeout();
    if (this.called)
      return console.warn('double callback!');
    this.called = true;
    if (err) {
      err.response = res;
    }
    if (err && this.listeners('error').length > 0)
      this.emit('error', err);
    if (err) {
      return fn(err, res);
    }
    if (res && res.status >= 200 && res.status < 300) {
      return fn(err, res);
    }
    var msg = 'Unsuccessful HTTP response';
    if (res) {
      msg = http.STATUS_CODES[res.status] || msg;
    }
    var new_err = new Error(msg);
    new_err.original = err;
    new_err.response = res;
    new_err.status = (res) ? res.status : undefined;
    fn(err || new_err, res);
  };
  Request.prototype.end = function(fn) {
    var self = this;
    var data = this._data;
    var req = this.request();
    var buffer = this._buffer;
    var method = this.method;
    var timeout = this._timeout;
    debug('%s %s', this.method, this.url);
    this._callback = fn || noop;
    try {
      var querystring = qs.stringify(this.qs, {indices: false});
      querystring += ((querystring.length && this.qsRaw.length) ? '&' : '') + this.qsRaw.join('&');
      req.path += querystring.length ? (~req.path.indexOf('?') ? '&' : '?') + querystring : '';
    } catch (e) {
      return this.callback(e);
    }
    if (timeout && !this._timer) {
      debug('timeout %sms %s %s', timeout, this.method, this.url);
      this._timer = setTimeout(function() {
        var err = new Error('timeout of ' + timeout + 'ms exceeded');
        err.timeout = timeout;
        err.code = 'ECONNABORTED';
        self.abort();
        self.callback(err);
      }, timeout);
    }
    if ('HEAD' != method && !req._headerSent) {
      if ('string' != typeof data) {
        var contentType = req.getHeader('Content-Type');
        if (contentType)
          contentType = contentType.split(';')[0];
        var serialize = exports.serialize[contentType];
        if (serialize)
          data = serialize(data);
      }
      if (data && !req.getHeader('Content-Length')) {
        this.set('Content-Length', Buffer.byteLength(data));
      }
    }
    req.on('response', function(res) {
      debug('%s %s -> %s', self.method, self.url, res.statusCode);
      var max = self._maxRedirects;
      var mime = utils.type(res.headers['content-type'] || '') || 'text/plain';
      var len = res.headers['content-length'];
      var type = mime.split('/');
      var subtype = type[1];
      var type = type[0];
      var multipart = 'multipart' == type;
      var redirect = isRedirect(res.statusCode);
      var parser = self._parser;
      self.res = res;
      if ('HEAD' == self.method) {
        var response = new Response(self);
        self.response = response;
        response.redirects = self._redirectList;
        self.emit('response', response);
        self.callback(null, response);
        self.emit('end');
        return ;
      }
      if (self.piped) {
        return ;
      }
      if (redirect && self._redirects++ != max) {
        return self.redirect(res);
      }
      if (/^(deflate|gzip)$/.test(res.headers['content-encoding'])) {
        utils.unzip(req, res);
      }
      if (multipart)
        buffer = false;
      if (!parser && multipart) {
        var form = new formidable.IncomingForm;
        form.parse(res, function(err, fields, files) {
          if (err)
            return self.callback(err);
          var response = new Response(self);
          self.response = response;
          response.body = fields;
          response.files = files;
          response.redirects = self._redirectList;
          self.emit('end');
          self.callback(null, response);
        });
        return ;
      }
      if (!parser && isImage(mime)) {
        exports.parse.image(res, function(err, obj) {
          if (err)
            return self.callback(err);
          var response = new Response(self);
          self.response = response;
          response.body = obj;
          response.redirects = self._redirectList;
          self.emit('end');
          self.callback(null, response);
        });
        return ;
      }
      if (null == buffer && isText(mime) || isJSON(mime))
        buffer = true;
      var parse = 'text' == type ? exports.parse.text : exports.parse[mime];
      if (isJSON(mime))
        parse = exports.parse['application/json'];
      if (buffer)
        parse = parse || exports.parse.text;
      if (parser)
        parse = parser;
      if (parse) {
        try {
          parse(res, function(err, obj) {
            if (err)
              self.callback(err);
            res.body = obj;
          });
        } catch (err) {
          self.callback(err);
          return ;
        }
      }
      if (!buffer) {
        debug('unbuffered %s %s', self.method, self.url);
        self.res = res;
        var response = new Response(self);
        self.response = response;
        response.redirects = self._redirectList;
        self.emit('response', response);
        self.callback(null, response);
        if (multipart)
          return ;
        res.on('end', function() {
          debug('end %s %s', self.method, self.url);
          self.emit('end');
        });
        return ;
      }
      self.res = res;
      res.on('end', function() {
        debug('end %s %s', self.method, self.url);
        var response = new Response(self);
        self.response = response;
        response.redirects = self._redirectList;
        self.emit('response', response);
        self.callback(null, response);
        self.emit('end');
      });
    });
    this.emit('request', this);
    var formData = this._formData;
    if (formData) {
      var headers = formData.getHeaders();
      for (var i in headers) {
        debug('setting FormData header: "%s: %s"', i, headers[i]);
        req.setHeader(i, headers[i]);
      }
      formData.getLength(function(err, length) {
        debug('got FormData Content-Length: %s', length);
        if ('number' == typeof length) {
          req.setHeader('Content-Length', length);
        }
        formData.pipe(req);
      });
    } else {
      req.end(data);
    }
    return this;
  };
  Request.prototype.toJSON = function() {
    return {
      method: this.method,
      url: this.url,
      data: this._data
    };
  };
  exports.Request = Request;
  function request(method, url) {
    if ('function' == typeof url) {
      return new Request('GET', method).end(url);
    }
    if (1 == arguments.length) {
      return new Request('GET', method);
    }
    return new Request(method, url);
  }
  methods.forEach(function(method) {
    var name = 'delete' == method ? 'del' : method;
    method = method.toUpperCase();
    request[name] = function(url, data, fn) {
      var req = request(method, url);
      if ('function' == typeof data)
        fn = data, data = null;
      if (data)
        req.send(data);
      fn && req.end(fn);
      return req;
    };
  });
  function isText(mime) {
    var parts = mime.split('/');
    var type = parts[0];
    var subtype = parts[1];
    return 'text' == type || 'x-www-form-urlencoded' == subtype;
  }
  function isImage(mime) {
    var parts = mime.split('/');
    var type = parts[0];
    var subtype = parts[1];
    return 'image' == type;
  }
  function isJSON(mime) {
    if (!mime)
      return false;
    var parts = mime.split('/');
    var type = parts[0];
    var subtype = parts[1];
    return subtype && subtype.match(/json/i);
  }
  function isRedirect(code) {
    return ~[301, 302, 303, 305, 307, 308].indexOf(code);
  }
})(require("buffer").Buffer);
