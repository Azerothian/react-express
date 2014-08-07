(function() {
  var Promise, ReactExpress, baseLayout, debug, fs, glob, jsrender, paths, rimraf, serveStatic, url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  jsrender = require("./jsrender");

  baseLayout = require("./layout");

  Promise = require("bluebird");

  url = require("url");

  fs = require("fs");

  paths = require("path");

  debug = require("debug")("react-express:index");

  serveStatic = require("serve-static");

  rimraf = require("rimraf");

  glob = require("glob");

  module.exports = function(opts) {
    return new Promise(function(resolve, reject) {
      var reactRoute;
      reactRoute = new ReactExpress();
      return reactRoute.init(opts).then(function() {
        return resolve(reactRoute.express);
      }, reject);
    });
  };

  ReactExpress = (function() {
    function ReactExpress() {
      this.express = __bind(this.express, this);
      this.createComponent = __bind(this.createComponent, this);
      this.generateRoute = __bind(this.generateRoute, this);
      this.init = __bind(this.init, this);
    }

    ReactExpress.prototype.init = function(options) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var cache;
          cache = options.cache, _this.routes = options.routes, _this.basedir = options.basedir;
          _this.components = {};
          _this.cacheDir = paths.join(process.cwd(), cache);
          debug("cacheDir " + _this.cacheDir);
          _this.staticCache = serveStatic(_this.cacheDir);
          debug("rimraf");
          return rimraf(_this.cacheDir, function() {
            debug("mkdir");
            return fs.mkdir(_this.cacheDir, function(err) {
              var promises, route;
              debug("gen routes", _this.routes);
              promises = [];
              for (route in _this.routes) {
                debug("routes", route);
                promises.push(_this.generateRoute(route, _this.routes[route]));
              }
              return Promise.all(promises).then(function() {
                debug("routes generated", _this.components);
                return resolve();
              });
            });
          });
        };
      })(this));
    };

    ReactExpress.prototype.isGlob = function(str) {
      return str.indexOf("*") > -1;
    };

    ReactExpress.prototype.generateRoute = function(routePath, route) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var basePath, controlPath;
          basePath = paths.join(process.cwd(), route.basedir || _this.basedir);
          controlPath = paths.join(basePath, route.path);
          if (_this.isGlob(controlPath)) {
            return glob(controlPath, function(err, files) {
              var dir, file, fileName, promises, uri, _i, _len;
              promises = [];
              for (_i = 0, _len = files.length; _i < _len; _i++) {
                file = files[_i];
                dir = paths.dirname(file.replace(basePath, ""));
                fileName = paths.basename(file, paths.extname(file));
                uri = paths.resolve(routePath, dir, fileName);
                promises.push(_this.createComponent(uri, file, route));
              }
              return Promise.all(promises).then(resolve, reject);
            });
          } else {
            return _this.createComponent(routePath, controlPath, route).then(resolve, reject);
          }
        };
      })(this));
    };

    ReactExpress.prototype.createComponent = function(uri, controlPath, route) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var a, cachePath, component, _i, _len, _ref;
          cachePath = paths.join(_this.cacheDir, uri);
          component = {
            uri: uri,
            controlPath: controlPath,
            jsFile: "" + cachePath + ".js"
          };
          if (route.alias != null) {
            _ref = route.alias;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              a = _ref[_i];
              _this.components[a] = {
                uri: uri,
                controlPath: controlPath,
                jsFile: "" + cachePath + ".js",
                isAlias: true
              };
            }
          }
          _this.components[uri] = {
            uri: uri,
            controlPath: controlPath,
            jsFile: "" + cachePath + ".js"
          };
          return resolve();
        };
      })(this));
    };

    ReactExpress.prototype.express = function(req, res, next) {
      return this.staticCache(req, res, next);
    };

    return ReactExpress;

  })();

}).call(this);
