(function() {
  var React, body, debug, div, glob, head, html, parseurl, paths, renderHtml, renderJs, script, title, url, _ref;

  React = require("react");

  debug = require("debug")("react-express");

  url = require("url");

  parseurl = require("parseurl");

  paths = require("path");

  glob = require("glob");

  _ref = React.DOM, html = _ref.html, head = _ref.head, body = _ref.body, div = _ref.div, script = _ref.script, title = _ref.title;

  renderHtml = function(file, req, res, next) {
    var cls, scripts, str;
    debug("render start");
    res.setHeader('Content-Type', 'text/html');
    cls = require(file);
    scripts = [];
    if (cls.getScripts != null) {
      scripts = cls.getScripts().map(function(s) {
        return script({
          src: s
        });
      });
    }
    str = React.renderComponentToString(html({}, head({}), body({}, cls({}), scripts)));
    debug("render complete", str);
    return res.end(str);
  };

  renderJs = function(file, req, res, next) {
    return next();
  };

  module.exports = function(options) {
    var root;
    root = options.root;
    return function(req, res, next) {
      var originalUrl, path, processed;
      if ('GET' !== req.method && 'HEAD' !== req.method) {
        return next();
      }
      originalUrl = url.parse(req.originalUrl || req.url);
      processed = paths.normalize(parseurl(req).pathname);
      if (paths.sep === processed) {
        processed = "/index";
      }
      path = paths.join(__dirname, root, processed);
      debug("request", "" + path + ".*");
      return glob("" + path + ".*", function(err, files) {
        var fileName;
        debug("testing file", files, files.length === 0);
        if (files.length === 0) {
          return next();
        }
        debug("testing file", files.length === 0);
        fileName = files[0];
        if (paths.extname(processed) === "js") {
          return renderJs(path, req, res, next);
        } else {
          return renderHtml(path, req, res, next);
        }
      });
    };
  };


  /*
  express = require "express"
  app = express()
  port = 1337
  app.use module.exports {
    root: "./tests/react/"
  }
  app.listen(port)
   */

}).call(this);
