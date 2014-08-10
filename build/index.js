(function() {
  var Promise, React, ReactExpress, baseLayout, debug, fs, glob, isGlob, jsrender, paths, rimraf, serveStatic, url,
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

  React = require("react");

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
      this.generateHtml = __bind(this.generateHtml, this);
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
            debug("cache directory", _this.cacheDir);
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
                routePath = url.resolve(routeName, relative).replace(fileExt, "");
                promises.push(_this.createRoute(routePath, relative, file, route));
              }
              return Promise.all(promises).then(resolve, reject);
            });
          } else {
            relativePath = paths.relative(_this.filesDir, controlPath);
            return _this.createRoute(routeName, relativePath, controlPath, route).then(resolve, reject);
          }
        };
      })(this));
    };

    ReactExpress.prototype.createRoute = function(routePath, filePath, controlPath, route) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var a, cleanPath, jsFile, newRoute, _i, _len, _ref;
          cleanPath = routePath.replace(/\\/g, "/");
          jsFile = _this.getJsFileSync(filePath);
          debug("routePath", cleanPath, jsFile);
          newRoute = {
            control: controlPath,
            compile: jsFile,
            props: route.props != null ? route.props : void 0
          };
          _this.routes[cleanPath] = newRoute;
          if (route.alias != null) {
            _ref = route.alias;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              a = _ref[_i];
              _this.routes[a] = newRoute;
            }
          }
          return resolve();
        };
      })(this));
    };

    ReactExpress.prototype.getJsFileSync = function(path) {
      var rel;
      if (this.js[path] == null) {
        debug("file was not found ", path, this.js);
      }
      rel = paths.relative(this.cacheDir, this.js[path]).replace(/\\/g, "/");
      return rel;
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
      var route, uri;
      uri = url.parse(req.url, true);
      debug("url pathname", uri.pathname);
      for (route in this.routes) {
        if (("" + route) === uri.pathname) {
          return this.generateHtml(route, this.routes[route], req, res, next);
        }
      }
      debug("forwarding to cache");
      return this.staticCache(req, res, next);
    };

    ReactExpress.prototype.generateHtml = function(routeName, route, req, res, next) {
      var cls, component, componentHtml, componentProps, e, html, layout, links, p, scripts;
      res.setHeader('Content-Type', 'text/html');
      cls = require(route.control);
      scripts = [
        {
          src: route.compile,
          type: "text/javascript"
        }
      ];
      links = [];
      debug("cls.getScripts?");
      if (cls.getScripts != null) {
        scripts = scripts.concat(cls.getScripts());
      }
      if (cls.getCSS != null) {
        links = links.concat(cls.getCSS());
      }
      componentProps = {};
      if (route.props != null) {
        componentProps = route.props(req, res, cls);
      }
      try {
        debug("creating component");
        component = cls(componentProps);
        debug("render component html", component);
        componentHtml = React.renderComponentToString(component);
      } catch (_error) {
        e = _error;
        debug("err", e);
      }
      p = {
        title: "",
        scripts: scripts,
        links: links,
        html: componentHtml,
        componentProps: route.props != null ? route.props(cls, req, res) : void 0
      };
      layout = require("./layout")(p);
      html = React.renderComponentToStaticMarkup(layout);
      debug("render complete");
      return res.send(html);
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
