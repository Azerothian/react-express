(function() {
  var Promise, ReactExpress, baseLayout, debug, fs, glob, isGlob, jsrender, paths, rimraf, serveStatic, url,
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

  isGlob = function(str) {
    return str.indexOf("*") > -1;
  };

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
      this.clearCache = __bind(this.clearCache, this);
      this.getJsFileSync = __bind(this.getJsFileSync, this);
      this.createRoute = __bind(this.createRoute, this);
      this.generateRouteFromRule = __bind(this.generateRouteFromRule, this);
      this.generateRoutes = __bind(this.generateRoutes, this);
      this.generateJavascript = __bind(this.generateJavascript, this);
      this.init = __bind(this.init, this);
    }

    ReactExpress.prototype.init = function(options) {
      this.options = options;
      return new Promise((function(_this) {
        return function(resolve, reject) {
          _this.cacheDir = paths.join(process.cwd(), _this.options.cache);
          _this.filesDir = paths.join(process.cwd(), _this.options.basedir);
          return Promise.resolve().then(_this.clearCache).then(_this.generateJavascript).then(_this.generateRoutes).then(function() {
            _this.staticCache = serveStatic(_this.cacheDir);
            return resolve();
          }, reject);
        };
      })(this));
    };

    ReactExpress.prototype.generateJavascript = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var globPath;
          _this.js = {};
          globPath = "" + _this.filesDir + "/**/*.*";
          return glob(globPath, function(err, files) {
            var dir, file, name, out, p, promises, relative, _i, _len;
            if (err != null) {
              debug("generateJavascript: glob failed", err, globPath);
              return reject(err);
            }
            promises = [];
            debug("@filesDir", _this.filesDir);
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              relative = paths.relative(_this.filesDir, file);
              debug("relative", relative);
              p = paths.join(_this.cacheDir, relative);
              dir = paths.dirname(p);
              name = paths.basename(relative, paths.extname(relative));
              out = paths.join(dir, "" + name + ".js");
              _this.js[relative] = out;
              promises.push(jsrender(file, out, {
                basedir: _this.filesDir,
                excludeReact: true
              }));
            }
            return Promise.all(promises).then(resolve, reject);
          });
        };
      })(this));
    };

    ReactExpress.prototype.generateRoutes = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var promises, rname;
          _this.routes = {};
          promises = [];
          for (rname in _this.options.routes) {
            promises.push(_this.generateRouteFromRule(rname, _this.options.routes[rname]));
          }
          return Promise.all(promises).then(resolve, reject);
        };
      })(this));
    };

    ReactExpress.prototype.generateRouteFromRule = function(routeName, route) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var controlPath, promises, relativePath;
          controlPath = paths.join(_this.filesDir, route.path);
          if (isGlob(controlPath)) {
            promises = [];
            return glob(controlPath, function(err, files) {
              var file, fileExt, relative, routePath, _i, _len;
              if (err != null) {
                debug("generateRouteFromRule glob err", err, controlPath);
                return reject(err);
              }
              for (_i = 0, _len = files.length; _i < _len; _i++) {
                file = files[_i];
                fileExt = paths.extname(file);
                relative = paths.relative(_this.filesDir, file);
                routePath = url.resolve(routeName, relative);
                promises.push(_this.createRoute(routePath.replace(fileExt, ""), route, relative));
              }
              return Promise.all(promises).then(resolve, reject);
            });
          } else {
            relativePath = paths.relative(_this.filesDir, controlPath);
            return _this.createRoute(routeName, route, relativePath).then(resolve, reject);
          }
        };
      })(this));
    };

    ReactExpress.prototype.createRoute = function(routePath, route, filePath) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var jsFile;
          jsFile = _this.getJsFileSync(filePath);
          debug("routePath", routePath, jsFile);
          return resolve();
        };
      })(this));
    };

    ReactExpress.prototype.getJsFileSync = function(path) {
      if (this.js[path] == null) {
        debug("file was not found ", path, this.js);
      }
      return this.js[path];
    };

    ReactExpress.prototype.clearCache = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return rimraf(_this.cacheDir, function() {
            return fs.mkdir(_this.cacheDir, function(err) {
              if (err != null) {
                debug("clear cache rejected");
                return reject(err);
              }
              debug("clear cache success");
              return resolve();
            });
          });
        };
      })(this));
    };

    ReactExpress.prototype.express = function(req, res, next) {
      var route, uri, _i, _len, _ref;
      uri = url.parse(req.url, true);
      _ref = this.routes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        route = _ref[_i];
        if (route === uri.pathname) {
          debug("route to render html");
          return next();
        }
      }
      return this.staticCache(res, res, next);
    };

    return ReactExpress;

  })();


  /*
  class ReactExpress
    init: (@options) =>
      return new Promise (resolve, reject) =>
        @routes = {}
        @cacheDir = paths.join process.cwd(), @options.cache
        debug "cacheDir #{@cacheDir}"
        @staticCache = serveStatic(@cacheDir)
        debug "rimraf"
        rimraf @cacheDir, () =>
          debug "mkdir"
          fs.mkdir @cacheDir, (err) =>
             * Generate data
            debug "gen routes", @routes
            promises = []
            for route of @options.routes
              debug "routes", route
              promises.push @generateRoute route, @options.routes[route]
            Promise.all(promises).then () =>
              debug "routes generated", @routes
              resolve()
  
    isGlob: (str) ->
      return str.indexOf("*") > -1
  
    generateRoute: (routePath, route) =>
      return new Promise (resolve, reject) =>
        basePath = paths.join process.cwd(), route.basedir || @basedir
        controlPath = paths.join basePath, route.path
  
         *.replace(new RegExp('\\' + path.sep, 'g'), '/');
        if @isGlob(controlPath)
          glob controlPath, (err, files) =>
            promises = []
            for file in files
              dir = paths.dirname(file.replace(basePath, ""))
              fileName = paths.basename file, paths.extname(file)
              uri = paths.resolve routePath, dir, fileName# "#{routePath}#{p}/#{fileName}"
              promises.push @createComponent uri, file, route
            Promise.all(promises).then resolve, reject
        else
          @createComponent(routePath, controlPath, route).then resolve, reject
  
  
    createComponent: (uri, controlPath, routeData) =>
      return new Promise (resolve, reject) =>
        cachePath = paths.join @cacheDir, uri
        route = {
          uri: uri
          controlPath: controlPath
          jsFile: "#{cachePath}.js"
        }
        if routeData.alias?
          for a in route.alias
            @routes[a] = component
        @routes[uri] = component
        resolve()
  
    express: (req, res, next) =>
      @staticCache req, res, next
   */

}).call(this);
