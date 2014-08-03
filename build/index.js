(function() {
  var Promise, React, ReactExpress, body, browserify, debug, div, glob, head, html, link, parseurl, paths, script, title, url, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  React = require("react");

  debug = require("debug")("react-express");

  url = require("url");

  parseurl = require("parseurl");

  paths = require("path");

  glob = require("glob");

  browserify = require("browserify");

  Promise = require("bluebird");

  _ref = React.DOM, html = _ref.html, head = _ref.head, body = _ref.body, div = _ref.div, script = _ref.script, title = _ref.title, link = _ref.link;

  ReactExpress = (function() {
    function ReactExpress(browserify) {
      this.browserify = browserify;
      this.renderHtml = __bind(this.renderHtml, this);
      this.renderJs = __bind(this.renderJs, this);
      this.renderCheck = __bind(this.renderCheck, this);
      this.processPath = __bind(this.processPath, this);
      this.express = __bind(this.express, this);
      this.rootPath = paths.join(process.cwd(), this.browserify.basedir);
    }

    ReactExpress.prototype.express = function(req, res, next) {
      if ('GET' !== req.method && 'HEAD' !== req.method) {
        return next();
      }
      return this.processPath(req, res).then((function(_this) {
        return function(pathInfo) {
          debug("starting rendercheck", pathInfo);
          return _this.renderCheck(pathInfo, req, res).then(function() {
            return debug("finished");
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
          var ext, globPath, path, pathInfo, relative;
          url = parseurl(req);
          relative = url.pathname.replace("//", "/");
          ext = paths.extname(relative);
          relative = relative.replace(ext, "");
          debug("relate", relative, relative = relative.replace("//", ""));
          if ("/" === relative) {
            relative = "/index";
          }
          path = paths.join(_this.rootPath, relative);
          debug("processPath : relative", relative);
          debug("processPath : path", path);
          pathInfo = {
            relative: relative,
            fullPath: path,
            ext: ext
          };
          globPath = "." + relative + ".*";
          debug("globPath", globPath, _this.rootPath);
          return glob(globPath, {
            cwd: _this.rootPath
          }, function(err, files) {
            if (err != null) {
              debug("glob err", err);
            }
            debug("files found " + files.length, files);
            if (files.length > 0) {
              pathInfo.files = files;
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
          var b, basePath, bopts, opts;
          debug("renderJs");
          res.setHeader('Content-Type', 'text/javascript');
          basePath = "." + pathInfo.relative;
          debug("basePath", basePath);
          bopts = {};
          for (opts in _this.browserify) {
            bopts[opts] = _this.browserify[opts];
          }
          bopts.basedir = _this.rootPath;
          debug("start browserify", bopts);
          b = browserify(bopts).require(basePath, {
            expose: "app"
          }).require("react").bundle().pipe(res);
          return debug("done?");
        };
      })(this));
    };

    ReactExpress.prototype.renderHtml = function(pathInfo, req, res) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var cls, compHtml, components, filePath, links, scripts, startupScript, str;
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
          startupScript = "var app = require('app'), React = require('react'); var container = document.getElementById('react-component'); React.renderComponent(app({}), container);";
          debug("render component html");
          compHtml = React.renderComponentToString(cls({}));
          debug("create components");
          components = html({}, head({}), cls.getTitle != null ? title({}, cls.getTitle()) : void 0, links, body({}, div({
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
