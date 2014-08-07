(function() {
  var bgshim, browserify, debug, jsrender, paths,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  browserify = require("browserify");

  bgshim = require('browserify-global-shim');

  paths = require("path");

  debug = require("debug")("react-express:jsrender");

  module.exports = jsrender = (function() {
    function jsrender(options) {
      this.renderFile = __bind(this.renderFile, this);
      this.render = __bind(this.render, this);
      this.file = options.file, this.output = options.output, this.excludeReact = options.excludeReact, this.browserifyOptions = options.browserifyOptions, this.globalShim = options.globalShim, this.appName = options.appName;
      if (this.browserifyOptions == null) {
        this.browserifyOptions = {};
      }
      this.browserifyOptions.basedir = paths.dirname(this.file);
      if (this.file == null) {
        throw "no file is provided";
      }
      if (this.output == null) {
        throw "no target output is provided";
      }
      if (this.appName == null) {
        this.appName = "app";
      }
      if (this.globalShim == null) {
        this.globalShim = {};
      }
      if (this.excludeReact) {
        this.globalShim.react = 'React || React';
      }
    }

    jsrender.prototype.render = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var b, globalShim;
          globalShim = bgshim.configure(_this.globalShim);
          b = browserify(_this.browserifyOptions);
          b.transform(globalShim, {
            global: true
          });
          if (_this.excludeReact) {
            b.external("react");
          }
          b.require(basePath, {
            expose: _this.appName
          });
          return resolve(b.bundle());
        };
      })(this));
    };

    jsrender.prototype.renderFile = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.render().then(function(stream) {
            var write;
            write = fs.createWriteStream(this.output);
            stream.pipe(write);
            return write.on("close", function() {
              debug("fin");
              return resolve();
            });
          });
        };
      })(this));
    };

    return jsrender;

  })();

}).call(this);
