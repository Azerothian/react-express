(function() {
  var Promise, React, ReactExpress, body, browserify, debug, div, fs, glob, head, html, link, mkpath, paths, rimraf, script, serveStatic, title, url, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  React = require("react");

  debug = require("debug")("react-express");

  url = require("url");

  paths = require("path");

  glob = require("glob");

  browserify = require("browserify");

  Promise = require("bluebird");

  serveStatic = require("serve-static");

  mkpath = require("mkpath");

  fs = require("fs");

  rimraf = require("rimraf");

  _ref = React.DOM, html = _ref.html, head = _ref.head, body = _ref.body, div = _ref.div, script = _ref.script, title = _ref.title, link = _ref.link;

  ReactExpress = (function() {
    function ReactExpress(options) {
      this.options = options != null ? options : {};
      this.renderHtml = __bind(this.renderHtml, this);
      this.renderJs = __bind(this.renderJs, this);
      this.renderCheck = __bind(this.renderCheck, this);
      this.processPath = __bind(this.processPath, this);
      this.express = __bind(this.express, this);
      if (this.options.version == null) {
        this.options.version = "0.11.1";
      }
      if (this.options.cachedir == null) {
        this.options.cachedir = "react-cache";
      }
      this.rootPath = paths.join(process.cwd(), this.options.basedir);
      this.cacheDir = paths.join(process.cwd(), this.options.cachedir);
      debug("@cacheDir", this.cacheDir);
      this.staticCache = serveStatic(this.cacheDir);
      rimraf(this.cacheDir, function() {});
    }

    ReactExpress.prototype.express = function(req, res, next) {
      if ('GET' !== req.method && 'HEAD' !== req.method) {
        return next();
      }
      return this.processPath(req, res).then((function(_this) {
        return function(pathInfo) {
          debug("starting rendercheck", pathInfo);
          return _this.renderCheck(pathInfo, req, res).then(function() {
            debug("finished executing static cache");
            return _this.staticCache(req, res, next);
          }, function() {
            debug("rendercheck failed");
            return next();
          });
        };
      })(this), function() {
        debug("not found");
        return next();
      });
    };

    ReactExpress.prototype.processPath = function(req, res) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var ext, globPath, path, pathInfo, relative, uri;
          debug("start");
          uri = url.parse(req.url, true);
          relative = uri.pathname.replace("//", "/");
          ext = paths.extname(relative);
          relative = relative.replace(ext, "");
          debug("relate", relative);
          relative = relative.replace("//", "");
          if ("/" === relative) {
            relative = "/index";
          }
          path = paths.join(_this.rootPath, relative);
          debug("processPath : relative", relative);
          debug("processPath : path", path);
          pathInfo = {
            url: uri,
            relative: relative,
            fullPath: path,
            ext: ext
          };
          globPath = "." + relative + ".*";
          debug("globPath", globPath, _this.rootPath);
          return glob(globPath, {
            cwd: _this.rootPath
          }, function(err, files) {
            var check, e, ex, file, _i, _j, _len, _len1, _ref1;
            if (err != null) {
              debug("glob err", err);
            }
            pathInfo.files = files;
            debug("files found " + files.length, files);
            if (files.length > 0) {
              check = false;
              if (_this.options.extensions != null) {
                for (_i = 0, _len = files.length; _i < _len; _i++) {
                  file = files[_i];
                  ex = paths.extname(file);
                  _ref1 = _this.options.extensions;
                  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                    e = _ref1[_j];
                    debug(" ex vs e ", ex, e, ex === e);
                    if (ex === e) {
                      check = true;
                      break;
                    }
                  }
                  if (check) {
                    break;
                  }
                }
                if (!check) {
                  debug("invalid extension");
                  return reject();
                }
              }
              return resolve(pathInfo);
            }
            return reject();
          });
        };
      })(this));
    };

    ReactExpress.prototype.renderCheck = function(pathInfo, req, res) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          debug("rendercheck", pathInfo);
          if (pathInfo.ext === ".js") {
            debug("starting renderJs");
            return _this.renderJs(pathInfo, req, res).then(resolve, reject);
          }
          debug("starting renderHtml");
          return _this.renderHtml(pathInfo, req, res).then(resolve, reject);
        };
      })(this));
    };

    ReactExpress.prototype.renderJs = function(pathInfo, req, res) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var basePath, cacheFilePath;
          debug("renderJs");
          basePath = "." + pathInfo.relative;
          cacheFilePath = paths.join(_this.cacheDir, basePath) + ".js";
          return fs.exists(cacheFilePath, function(exists) {
            var b, bopts, cacheFileDir, globalShim, opts;
            if (exists) {
              debug("js file exists, no need to render");
              return resolve();
            }
            cacheFileDir = paths.dirname(cacheFilePath);
            res.setHeader('Content-Type', 'text/javascript');
            debug("basePath", basePath);
            bopts = {};
            for (opts in _this.options) {
              if (opts !== "version" && opts !== "cache") {
                bopts[opts] = _this.options[opts];
              }
            }
            bopts.basedir = _this.rootPath;
            debug("start browserify", bopts);
            globalShim = require('browserify-global-shim').configure({
              'react': 'React || React'
            });
            b = browserify(bopts);
            debug("creating dir", cacheFileDir);
            return mkpath(cacheFileDir, function(err) {
              var strm, write;
              debug("cachePath", cacheFilePath);
              b.transform(globalShim, {
                global: true
              });
              b.external("react");
              b.require(basePath, {
                expose: "app"
              });
              strm = b.bundle();
              write = fs.createWriteStream(cacheFilePath);
              strm.pipe(write);
              return write.on("close", function() {
                debug("fin");
                return resolve();
              });
            });
          });
        };
      })(this));
    };

    ReactExpress.prototype.renderHtml = function(pathInfo, req, res) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var cls, compHtml, component, components, e, filePath, links, props, scripts, startupScript, str;
          debug("render html");
          res.setHeader('Content-Type', 'text/html');
          filePath = paths.normalize(pathInfo.fullPath);
          debug("require check for scripts?", filePath);
          cls = require(filePath);
          scripts = [
            script({
              src: "" + pathInfo.relative + ".js",
              type: "text/javascript"
            })
          ];
          links = [];
          debug("cls.getScripts?");
          if (cls.getScripts != null) {
            scripts = scripts.concat(cls.getScripts().map(function(s) {
              return script({
                src: s,
                type: "text/javascript"
              });
            }));
          }
          if (cls.getCSS != null) {
            links = links.concat(cls.getCSS().map(function(c) {
              return link({
                href: c,
                rel: "stylesheet",
                type: "text/css"
              });
            }));
          }
          props = JSON.stringify(pathInfo.url.query);
          startupScript = "var app = require('app'); var r = React; if(!r) { r = require('react'); } var container = document.getElementById('react-component'); r.renderComponent(app(" + props + "), container);";
          try {
            debug("creating component");
            component = cls(pathInfo.url.query);
            debug("render component html", component);
            compHtml = React.renderComponentToString(component);
          } catch (_error) {
            e = _error;
            debug("err", e);
          }
          debug("create components");
          components = html({}, head({}), cls.getTitle != null ? title({}, cls.getTitle()) : void 0, script({
            src: "//cdnjs.cloudflare.com/ajax/libs/react/" + _this.options.version + "/react.min.js",
            type: "text/javascript"
          }), links, body({}, div({
            id: "react-component",
            dangerouslySetInnerHTML: {
              "__html": compHtml
            }
          }), scripts, script({
            type: "text/javascript",
            dangerouslySetInnerHTML: {
              "__html": startupScript
            }
          })));
          debug("render components");
          str = React.renderComponentToStaticMarkup(components);
          debug("render complete", str);
          return res.send(str);
        };
      })(this));
    };

    return ReactExpress;

  })();

  module.exports = function(options) {
    return new ReactExpress(options).express;
  };


  /*
  url = url.parse req.originalUrl || req.url
  path = paths.join __dirname, root, processed
  processed = paths.normalize parseurl(req).pathname
  if paths.sep is processed
    processed = "/index"
  debug "processPath", url, path, processed
  glob "#{path}.*", (err, files) ->
    if files.length == 0
      return next()
    fileName = files[0]
  
    if paths.extname(processed) is "js"
      renderJs(path,processed, req, res, next)
    else
      renderHtml(path,processed, req, res, next)
   */

}).call(this);
